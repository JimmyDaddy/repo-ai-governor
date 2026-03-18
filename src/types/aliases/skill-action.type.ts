import type {
  DOCTOR_SKILL_ACTIONS,
  INSTALL_SKILL_ACTIONS,
  LIST_SKILL_ACTIONS,
  SUPPORTED_SKILL_ACTIONS,
} from "../../constants/skill-actions.js";

export type SkillAction = (typeof SUPPORTED_SKILL_ACTIONS)[number];

export type ListSkillAction = (typeof LIST_SKILL_ACTIONS)[number];

export type InstallSkillAction = (typeof INSTALL_SKILL_ACTIONS)[number];

export type DoctorSkillAction = (typeof DOCTOR_SKILL_ACTIONS)[number];
