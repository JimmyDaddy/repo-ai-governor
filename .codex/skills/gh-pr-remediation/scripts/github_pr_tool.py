#!/usr/bin/env python3
"""Collect GitHub PR status for the current branch and resolve review threads."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Any


class UserFacingError(RuntimeError):
    """Raised when the caller needs to fix input, auth, or environment state."""


def run_command(command: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    """Run a command and capture stdout and stderr for later parsing."""
    completed = subprocess.run(
        command,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
    )
    if check and completed.returncode != 0:
        message = completed.stderr.strip() or completed.stdout.strip() or "unknown command failure"
        raise UserFacingError(f"Command failed: {' '.join(command)}\n{message}")
    return completed


def ensure_github_cli_authenticated() -> None:
    """Require GitHub CLI auth before attempting any network query."""
    run_command(["gh", "--version"])
    auth = run_command(["gh", "auth", "status"], check=False)
    if auth.returncode != 0:
        detail = auth.stderr.strip() or auth.stdout.strip()
        raise UserFacingError(
            "GitHub CLI is not authenticated. Run `gh auth login` or set `GH_TOKEN`, then re-run.\n"
            f"{detail}"
        )


def resolve_repo_root(explicit_repo_root: str | None) -> Path:
    """Resolve the git repository root from the provided path or current workspace."""
    if explicit_repo_root:
        return Path(explicit_repo_root).expanduser().resolve()
    repo_root = run_command(["git", "rev-parse", "--show-toplevel"]).stdout.strip()
    if not repo_root:
        raise UserFacingError("Failed to resolve the git repository root.")
    return Path(repo_root)


def resolve_branch(repo_root: Path, explicit_branch: str | None) -> str:
    """Resolve the current branch unless the caller supplied one explicitly."""
    if explicit_branch:
        return explicit_branch
    branch = run_command(["git", "branch", "--show-current"], cwd=repo_root).stdout.strip()
    if not branch:
        raise UserFacingError("Failed to resolve the current branch.")
    return branch


def resolve_repo_slug(repo_root: Path, explicit_repo: str | None) -> str:
    """Resolve the GitHub owner/repo slug from origin when needed."""
    if explicit_repo:
        return explicit_repo

    origin_url = run_command(["git", "remote", "get-url", "origin"], cwd=repo_root).stdout.strip()
    patterns = (
        r"^git@github\.com:(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$",
        r"^https://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?$",
        r"^ssh://git@github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?$",
    )
    for pattern in patterns:
        match = re.match(pattern, origin_url)
        if match:
            return f"{match.group('owner')}/{match.group('repo')}"

    raise UserFacingError(
        "Failed to parse the GitHub repository from `origin`. "
        "Pass `--repo owner/repo` explicitly."
    )


def resolve_pr_number(repo_root: Path, repo_slug: str, explicit_pr_number: int | None, branch: str) -> int:
    """Resolve the pull request number for the target branch."""
    if explicit_pr_number is not None:
        return explicit_pr_number

    command = ["gh", "pr", "view", branch, "--repo", repo_slug, "--json", "number"]
    completed = run_command(command, cwd=repo_root, check=False)
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise UserFacingError(
            "No pull request is associated with the target branch right now.\n"
            f"{detail}"
        )

    payload = json.loads(completed.stdout)
    return int(payload["number"])


def gh_json(command: list[str], cwd: Path | None = None, allow_return_codes: set[int] | None = None) -> Any:
    """Run a GitHub CLI command that prints JSON and return the decoded payload."""
    completed = run_command(command, cwd=cwd, check=False)
    allowed = {0}
    if allow_return_codes:
        allowed |= allow_return_codes
    if completed.returncode not in allowed:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise UserFacingError(f"Command failed: {' '.join(command)}\n{detail}")

    output = completed.stdout.strip()
    if not output:
        return []
    return json.loads(output)


def fetch_pr_summary(repo_root: Path, repo_slug: str, pr_number: int) -> dict[str, Any]:
    """Fetch stable PR summary fields from GitHub CLI."""
    fields = ",".join(
        [
            "author",
            "baseRefName",
            "headRefName",
            "isDraft",
            "latestReviews",
            "mergeStateStatus",
            "number",
            "reviewDecision",
            "state",
            "title",
            "updatedAt",
            "url",
        ]
    )
    return gh_json(
        ["gh", "pr", "view", str(pr_number), "--repo", repo_slug, "--json", fields],
        cwd=repo_root,
    )


def fetch_checks(repo_root: Path, repo_slug: str, pr_number: int, required_only: bool) -> list[dict[str, Any]]:
    """Fetch check status rows from GitHub CLI."""
    fields = ",".join(["bucket", "completedAt", "description", "event", "link", "name", "startedAt", "state", "workflow"])
    command = ["gh", "pr", "checks", str(pr_number), "--repo", repo_slug]
    if required_only:
        command.append("--required")
    command.extend(["--json", fields])
    completed = run_command(command, cwd=repo_root, check=False)
    if completed.returncode not in {0, 8}:
        detail = completed.stderr.strip() or completed.stdout.strip()
        if required_only and "no required checks reported" in detail.lower():
            return []
        raise UserFacingError(f"Command failed: {' '.join(command)}\n{detail}")

    output = completed.stdout.strip()
    if not output:
        return []
    payload = json.loads(output)
    if isinstance(payload, list):
        return payload
    return []


def fetch_review_threads(repo_root: Path, repo_slug: str, pr_number: int) -> list[dict[str, Any]]:
    """Fetch review threads with pagination through the GitHub GraphQL API."""
    owner, repo = repo_slug.split("/", 1)
    query = """
query($owner: String!, $repo: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviewThreads(first: 50, after: $after) {
        nodes {
          id
          isOutdated
          isResolved
          line
          originalLine
          path
          comments(first: 20) {
            nodes {
              id
              body
              createdAt
              url
              author {
                login
              }
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
}
""".strip()

    threads: list[dict[str, Any]] = []
    after: str | None = None
    while True:
        command = [
            "gh",
            "api",
            "graphql",
            "-f",
            f"query={query}",
            "-F",
            f"owner={owner}",
            "-F",
            f"repo={repo}",
            "-F",
            f"number={pr_number}",
        ]
        if after:
            command.extend(["-F", f"after={after}"])

        payload = gh_json(command, cwd=repo_root)
        connection = payload["data"]["repository"]["pullRequest"]["reviewThreads"]
        threads.extend(connection["nodes"])
        page_info = connection["pageInfo"]
        if not page_info["hasNextPage"]:
            break
        after = page_info["endCursor"]
    return threads


def shorten_body(body: str) -> str:
    """Compress a comment body into one display line."""
    one_line = " ".join(body.split())
    return textwrap.shorten(one_line, width=140, placeholder="...")


def bucket_counts(checks: list[dict[str, Any]]) -> dict[str, int]:
    """Count checks by bucket for quick status summaries."""
    counts: dict[str, int] = {}
    for check in checks:
        bucket = str(check.get("bucket") or "unknown")
        counts[bucket] = counts.get(bucket, 0) + 1
    return counts


def sort_check_rows(checks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sort checks so failing and pending items stay at the top."""
    priority = {"fail": 0, "pending": 1, "cancel": 2, "skipping": 3, "pass": 4}
    return sorted(checks, key=lambda item: (priority.get(str(item.get("bucket")), 9), str(item.get("workflow") or ""), str(item.get("name") or "")))


def format_status_text(payload: dict[str, Any]) -> str:
    """Render a human-readable summary for terminal and agent usage."""
    pr = payload["pr"]
    review = payload["review"]
    checks = payload["checks"]
    required_summary = checks["required_summary"]
    all_summary = checks["all_summary"]

    lines = [
        f"Repository: {payload['repo']}",
        f"Branch: {payload['branch']}",
        f"PR: #{pr['number']} {pr['title']}",
        f"URL: {pr['url']}",
        (
            "State: "
            f"{pr['state']} | Draft: {'yes' if pr.get('isDraft') else 'no'} | "
            f"Review decision: {pr.get('reviewDecision') or 'NONE'} | "
            f"Merge state: {pr.get('mergeStateStatus') or 'UNKNOWN'}"
        ),
        "",
        f"Unresolved review threads: {review['unresolved_thread_count']} / {review['total_thread_count']}",
    ]

    latest_reviews = pr.get("latestReviews") or []
    if latest_reviews:
        lines.append("Latest reviews:")
        for review_item in latest_reviews:
            author = (review_item.get("author") or {}).get("login") or "unknown"
            state = review_item.get("state") or "UNKNOWN"
            submitted = review_item.get("submittedAt") or review_item.get("createdAt") or "unknown time"
            lines.append(f"- {author}: {state} at {submitted}")
    else:
        lines.append("Latest reviews: none reported")

    if review["unresolved_threads"]:
        lines.append("")
        lines.append("Unresolved threads:")
        for thread in review["unresolved_threads"]:
            latest = thread.get("latestComment") or {}
            location = thread.get("path") or "unknown path"
            line_number = thread.get("line")
            if line_number:
                location = f"{location}:{line_number}"
            author = latest.get("author") or "unknown"
            lines.append(
                f"- {thread['id']} | {location} | outdated={thread['isOutdated']} | latest by {author}"
            )
            if latest.get("body"):
                lines.append(f"  {shorten_body(latest['body'])}")
            if latest.get("url"):
                lines.append(f"  {latest['url']}")
    else:
        lines.append("")
        lines.append("Unresolved threads: none")

    lines.extend(
        [
            "",
            "Required checks summary:",
            f"- fail={required_summary.get('fail', 0)} pending={required_summary.get('pending', 0)} cancel={required_summary.get('cancel', 0)} pass={required_summary.get('pass', 0)} skipping={required_summary.get('skipping', 0)}",
            "All checks summary:",
            f"- fail={all_summary.get('fail', 0)} pending={all_summary.get('pending', 0)} cancel={all_summary.get('cancel', 0)} pass={all_summary.get('pass', 0)} skipping={all_summary.get('skipping', 0)}",
        ]
    )

    failing_required = checks["required_failing"]
    pending_required = checks["required_pending"]
    if failing_required:
        lines.append("Required failing checks:")
        for check in failing_required:
            workflow = check.get("workflow") or "unknown workflow"
            name = check.get("name") or "unknown check"
            state = check.get("state") or "UNKNOWN"
            link = check.get("link") or ""
            lines.append(f"- {workflow} / {name} [{state}] {link}".rstrip())

    if pending_required:
        lines.append("Required pending checks:")
        for check in pending_required:
            workflow = check.get("workflow") or "unknown workflow"
            name = check.get("name") or "unknown check"
            state = check.get("state") or "UNKNOWN"
            link = check.get("link") or ""
            lines.append(f"- {workflow} / {name} [{state}] {link}".rstrip())

    return "\n".join(lines)


def build_status_payload(repo_root: Path, repo_slug: str, branch: str, pr_number: int) -> dict[str, Any]:
    """Build the normalized payload returned by the status command."""
    pr_summary = fetch_pr_summary(repo_root, repo_slug, pr_number)
    all_checks = sort_check_rows(fetch_checks(repo_root, repo_slug, pr_number, required_only=False))
    required_checks = sort_check_rows(fetch_checks(repo_root, repo_slug, pr_number, required_only=True))
    review_threads = fetch_review_threads(repo_root, repo_slug, pr_number)

    normalized_threads: list[dict[str, Any]] = []
    unresolved_threads: list[dict[str, Any]] = []
    for thread in review_threads:
        comments = ((thread.get("comments") or {}).get("nodes")) or []
        latest_comment = comments[-1] if comments else None
        normalized = {
            "id": thread["id"],
            "isOutdated": bool(thread.get("isOutdated")),
            "isResolved": bool(thread.get("isResolved")),
            "line": thread.get("line") or thread.get("originalLine"),
            "originalLine": thread.get("originalLine"),
            "path": thread.get("path"),
            "commentCount": len(comments),
            "latestComment": {
                "id": latest_comment.get("id"),
                "author": (latest_comment.get("author") or {}).get("login"),
                "body": latest_comment.get("body"),
                "createdAt": latest_comment.get("createdAt"),
                "url": latest_comment.get("url"),
            }
            if latest_comment
            else None,
            "comments": comments,
        }
        normalized_threads.append(normalized)
        if not normalized["isResolved"]:
            unresolved_threads.append(normalized)

    required_failing = [check for check in required_checks if check.get("bucket") == "fail"]
    required_pending = [check for check in required_checks if check.get("bucket") == "pending"]

    return {
        "repo_root": str(repo_root),
        "repo": repo_slug,
        "branch": branch,
        "pr": pr_summary,
        "review": {
            "total_thread_count": len(normalized_threads),
            "unresolved_thread_count": len(unresolved_threads),
            "threads": normalized_threads,
            "unresolved_threads": unresolved_threads,
        },
        "checks": {
            "all": all_checks,
            "required": required_checks,
            "all_summary": bucket_counts(all_checks),
            "required_summary": bucket_counts(required_checks),
            "required_failing": required_failing,
            "required_pending": required_pending,
        },
    }


def resolve_review_thread(repo_root: Path, thread_id: str) -> dict[str, Any]:
    """Resolve one review thread by node id through GraphQL mutation."""
    mutation = """
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread {
      id
      isResolved
    }
  }
}
""".strip()
    payload = gh_json(
        [
            "gh",
            "api",
            "graphql",
            "-f",
            f"query={mutation}",
            "-F",
            f"threadId={thread_id}",
        ],
        cwd=repo_root,
    )
    return payload["data"]["resolveReviewThread"]["thread"]


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI parser for status collection and thread resolution."""
    parser = argparse.ArgumentParser(
        description="Inspect the current branch's GitHub PR and resolve review threads.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    status_parser = subparsers.add_parser("status", help="Collect PR status for the current branch or a target PR.")
    status_parser.add_argument("--repo-root", help="Override the git repository root.")
    status_parser.add_argument("--repo", help="Override the GitHub owner/repo slug.")
    status_parser.add_argument("--branch", help="Override the target branch used to resolve the PR.")
    status_parser.add_argument("--pr-number", type=int, help="Use this PR number instead of inferring from branch.")
    status_parser.add_argument("--json", action="store_true", help="Print machine-readable JSON instead of a text summary.")

    resolve_parser = subparsers.add_parser("resolve-thread", help="Resolve one or more review thread ids.")
    resolve_parser.add_argument("thread_ids", nargs="+", help="One or more GitHub review thread node ids.")
    resolve_parser.add_argument("--repo-root", help="Override the git repository root.")
    resolve_parser.add_argument("--json", action="store_true", help="Print machine-readable JSON.")

    return parser


def main() -> int:
    """Dispatch subcommands and print the requested result."""
    parser = build_parser()
    args = parser.parse_args()

    try:
        ensure_github_cli_authenticated()
        repo_root = resolve_repo_root(getattr(args, "repo_root", None))

        if args.command == "status":
            branch = resolve_branch(repo_root, args.branch)
            repo_slug = resolve_repo_slug(repo_root, args.repo)
            pr_number = resolve_pr_number(repo_root, repo_slug, args.pr_number, branch)
            payload = build_status_payload(repo_root, repo_slug, branch, pr_number)
            if args.json:
                print(json.dumps(payload, indent=2, sort_keys=True))
            else:
                print(format_status_text(payload))
            return 0

        if args.command == "resolve-thread":
            results = [resolve_review_thread(repo_root, thread_id) for thread_id in args.thread_ids]
            if args.json:
                print(json.dumps({"resolved_threads": results}, indent=2, sort_keys=True))
            else:
                for result in results:
                    print(f"Resolved thread {result['id']}: isResolved={result['isResolved']}")
            return 0

        raise UserFacingError(f"Unsupported command: {args.command}")
    except UserFacingError as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
