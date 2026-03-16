# Changelog

## [0.1.4](https://github.com/JimmyDaddy/repo-ai-governor/compare/v0.1.3...v0.1.4) (2026-03-16)

### Bug Fixes

* **ci:** add environment specification for npm publish job ([9a84959](https://github.com/JimmyDaddy/repo-ai-governor/commit/9a8495969d02d2d7c4316de28479bafef85db124))
* **ci:** enforce oidc-only npm publish flow ([591c9ed](https://github.com/JimmyDaddy/repo-ai-governor/commit/591c9edaf12b9d301886d2027a364ae27e72a286))
* **ci:** remove environment specification from npm publish job ([b1a007d](https://github.com/JimmyDaddy/repo-ai-governor/commit/b1a007dbafcb5d38cadc2d4a3d83b280f21ab335))
* **init:** bootstrap dependencies and skills for npx onboarding ([5c83869](https://github.com/JimmyDaddy/repo-ai-governor/commit/5c8386913040bab45ba1c4d8f5d48d58c8a582a8))
* **publish:** add provenance flag to npm publish command and update publishConfig ([c170a04](https://github.com/JimmyDaddy/repo-ai-governor/commit/c170a043967264e3d228e16747528abde53a711a))
* **publish:** add public access flag to npm publish command ([cebb083](https://github.com/JimmyDaddy/repo-ai-governor/commit/cebb0835af1d287109aa278d5276a0e9b13d3614))
* **publish:** add registry-url to setup-node step and enhance npm publish command ([2ea5464](https://github.com/JimmyDaddy/repo-ai-governor/commit/2ea54640bbcb23e037db30af2c86edc61faa4500))
* **publish:** downgrade setup-node action to v4 in npm publish workflow ([f5d748a](https://github.com/JimmyDaddy/repo-ai-governor/commit/f5d748a725fcd1b374acad8c88361ce19780692e))
* **publish:** remove unnecessary registry-url from setup-node step ([594e2ef](https://github.com/JimmyDaddy/repo-ai-governor/commit/594e2ef9c4aa116b2e151d95beab46035ddb8dce))
* **publish:** simplify npm publish command by removing authentication cleanup ([c966f2f](https://github.com/JimmyDaddy/repo-ai-governor/commit/c966f2f27289ef3737e6989205117a24fd3b88ed))
* **publish:** simplify npm publish step by removing OIDC auth token deletion ([0e6d06d](https://github.com/JimmyDaddy/repo-ai-governor/commit/0e6d06dfa66405db71e5d7018dbf167d60c38384))
* **publish:** upgrade Node.js to 24 and ensure OIDC trusted publishing by clearing NODE_AUTH_TOKEN/NPM_TOKEN ([fdf494e](https://github.com/JimmyDaddy/repo-ai-governor/commit/fdf494ecb1a2de400db79eeec3363b0e533a5be5))

## 0.1.3 (2026-03-16)

### Features

* **adapters:** add claude code example and close sprint-006 ([a6bc094](https://github.com/JimmyDaddy/repo-ai-governor/commit/a6bc094e289223af624a9909396dbcf29c7392e5))
* **adapters:** add codex and copilot examples ([cd25046](https://github.com/JimmyDaddy/repo-ai-governor/commit/cd25046de2df8a364420c024ef549ed8b27cc112))
* **adapters:** add unified interface model ([b62ed99](https://github.com/JimmyDaddy/repo-ai-governor/commit/b62ed9987700115d39a742cf76817955267bf494))
* **agent-entry:** externalize workspace context ([5de4232](https://github.com/JimmyDaddy/repo-ai-governor/commit/5de4232b012d8388e6672a486595a34b67349123))
* **check:** implement governance validation command ([d699c42](https://github.com/JimmyDaddy/repo-ai-governor/commit/d699c428bf7b08310e734ec6231ceaf8fdb00d3a))
* **ci:** add governance automation and acceptance kit ([a31ee9b](https://github.com/JimmyDaddy/repo-ai-governor/commit/a31ee9b3730e6ccde59ee021eee5831662b4b1ff))
* **cli:** bootstrap commander-based mvp workflow ([21c6737](https://github.com/JimmyDaddy/repo-ai-governor/commit/21c67372295f32cfbc6a6175c569194b8bb53d22))
* **config:** add resolved config loader ([718e9c8](https://github.com/JimmyDaddy/repo-ai-governor/commit/718e9c882510414933d9b11ec8bf29228c4554e9))
* **config:** add schema bundle validation ([5fae580](https://github.com/JimmyDaddy/repo-ai-governor/commit/5fae5809ef3078984096c99635a8efce7e03bae0))
* **doctor:** implement repository health checks ([bf50e99](https://github.com/JimmyDaddy/repo-ai-governor/commit/bf50e994854d27924d645f2c6ba7e0ea1b93f29a))
* **extensibility:** reserve script extension interface ([a48746f](https://github.com/JimmyDaddy/repo-ai-governor/commit/a48746f1c65989ea75f07527dc73023c4332057c))
* **init:** add locale-aware bootstrap templates ([271e950](https://github.com/JimmyDaddy/repo-ai-governor/commit/271e950ce55feb0b4483cc4acc5bd01595a419a2))
* **plan:** generate sprint artifacts from standards ([7c3f2ea](https://github.com/JimmyDaddy/repo-ai-governor/commit/7c3f2eaaf5039e95715b1c03d6ad4449b586ed2d))
* **release:** add ga onboarding and release assets ([2487f86](https://github.com/JimmyDaddy/repo-ai-governor/commit/2487f86305d3dfe89fa848241f29fdd97de60dfd))
* **release:** add upgrade command and distribution checks ([12af86c](https://github.com/JimmyDaddy/repo-ai-governor/commit/12af86c32faf42f662471b684597e56271425fde))
* **report:** implement report rendering command ([9ae59bd](https://github.com/JimmyDaddy/repo-ai-governor/commit/9ae59bd360070fc181c2ab3090247f7d8a1c1cbc))
* **reporting:** add unified report model ([4029a1b](https://github.com/JimmyDaddy/repo-ai-governor/commit/4029a1b1ac5fbaff4e21f9ee4a7e878001babbcb))
* **review:** add verification lifecycle command ([63fc049](https://github.com/JimmyDaddy/repo-ai-governor/commit/63fc04999ec87d81a3fd733c33d35785c83f20a9))
* **review:** implement governance review command ([0f9f849](https://github.com/JimmyDaddy/repo-ai-governor/commit/0f9f8490726f20d9e40034ffc9045c4cea82492f))
* **skills:** add management commands ([51d955c](https://github.com/JimmyDaddy/repo-ai-governor/commit/51d955ce60a9ebb92a699697ee1aed59e3cd0555))
* **skills:** add official governance assets ([14d8f35](https://github.com/JimmyDaddy/repo-ai-governor/commit/14d8f352bd91b48ecf0e4b86ed4e1f6646bdddd5))
* **skills:** define official package layout ([7cc8d2c](https://github.com/JimmyDaddy/repo-ai-governor/commit/7cc8d2c725da959fe9ce53d321f55e288ab3734a))
* **slots:** add runtime resolution pipeline ([53f0400](https://github.com/JimmyDaddy/repo-ai-governor/commit/53f040088b157a749904cea2a1450040c8430cf0))
* **slots:** expand declarative slot model ([eb9423b](https://github.com/JimmyDaddy/repo-ai-governor/commit/eb9423b979ab04a44a08f548786af8438c0538a7))
* **standards:** add package data model ([cdb9735](https://github.com/JimmyDaddy/repo-ai-governor/commit/cdb973533f46665a911ca5e808299e4d5763df1f))
* **workflow:** add minimal governance engine ([9a5646a](https://github.com/JimmyDaddy/repo-ai-governor/commit/9a5646a527add62be0d22ca71fc6da5f2b8bc634))
* **workflow:** add repository layout and delivery skill ([934f44d](https://github.com/JimmyDaddy/repo-ai-governor/commit/934f44df4545e414f97a2af216cbd443dd718be7))
* **workflow:** add standard template model ([65bc8ea](https://github.com/JimmyDaddy/repo-ai-governor/commit/65bc8ea8fa86f21377fb8ff093fd36ee352d17ea))
* **workflow:** formalize sprint artifact conventions ([a8d5d61](https://github.com/JimmyDaddy/repo-ai-governor/commit/a8d5d6197dcd8e67a2778ed1b97c10ac9b3195c9))
* 添加项目状态报告文档并更新版本号至 0.1.2 ([cfb6f5e](https://github.com/JimmyDaddy/repo-ai-governor/commit/cfb6f5e53cbea15968908c40bb26f0b3ecd7690f))

### Bug Fixes

* **release:** align scoped package publish flow ([24da8da](https://github.com/JimmyDaddy/repo-ai-governor/commit/24da8daf9b9ddfaaaf9a398a4bfcb9ea7cce876d))
* **release:** make getting-started check portable ([9158b59](https://github.com/JimmyDaddy/repo-ai-governor/commit/9158b591d52ac1736aa4cf23402b6bd90eb8b2fd))
* revert version to 0.1.2 in package.json ([06404a9](https://github.com/JimmyDaddy/repo-ai-governor/commit/06404a9e40f6f27096bb445c6e6abe1b352105aa))

[English](./CHANGELOG.md) | [简体中文](./CHANGELOG.zh-CN.md)

All notable changes to this project will be documented in this file.

The format follows Keep a Changelog and uses Semantic Versioning with the repository-specific release policy documented in `docs/release-ga/sprint-001/ga-release-flow.md`.

## [Unreleased]

### Planned

- Formal GA release workflow and version strategy documentation
- Public-facing README and Quick Start
- Remote release / tag / changelog automation skeleton
- Ten-minute getting-started acceptance path

## [0.1.0] - 2026-03-14

### Added

- Commander-based CLI with `init`, `doctor`, `plan`, `check`, `review`, `review-verify`, `report`, and `upgrade`
- Repository governance configuration loading, schema validation, and bootstrap templates
- Governance workflow engine, standards package, slot runtime, and reporting model
- Codex, GitHub Copilot, and Claude Code adapter examples
- CI invocation scripts, acceptance kit, local distribution verification, and release candidate checks
