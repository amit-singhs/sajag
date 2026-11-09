/** Domain enumerations shared by the API and the web app. Single source of truth. */

export const QUESTION_TYPES = ['single', 'multi', 'true_false', 'text'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SCORING_MODES = ['all_or_nothing', 'partial'] as const;
export type ScoringMode = (typeof SCORING_MODES)[number];

export const CAMPAIGN_STATUSES = ['draft', 'live', 'closed'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const RESULTS_VISIBILITY = ['immediate', 'after_close', 'hidden'] as const;
export type ResultsVisibility = (typeof RESULTS_VISIBILITY)[number];

export const CAMPAIGN_LANGUAGES = ['hi', 'en', 'hi_en'] as const;
export type CampaignLanguage = (typeof CAMPAIGN_LANGUAGES)[number];

export const NOTICE_LANGUAGES = ['hi', 'en'] as const;
export type NoticeLanguage = (typeof NOTICE_LANGUAGES)[number];

export const AGE_BANDS = ['adult', 'minor'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const MINOR_POLICIES = ['disallow', 'guardian'] as const;
export type MinorPolicy = (typeof MINOR_POLICIES)[number];

/** declaration = guardian states name, relation and mobile (unverified) and consents. otp / digilocker = verified (future). */
export const GUARDIAN_METHODS = ['declaration', 'otp', 'digilocker'] as const;
export type GuardianMethod = (typeof GUARDIAN_METHODS)[number];

export const GUARDIAN_RELATIONS = ['mother', 'father', 'legal_guardian'] as const;
export type GuardianRelation = (typeof GUARDIAN_RELATIONS)[number];

export const CONSENT_METHODS = ['self', 'guardian_declared', 'guardian_otp', 'guardian_digilocker'] as const;
export type ConsentMethod = (typeof CONSENT_METHODS)[number];

/** Optional personal fields an admin may choose to collect. Mobile and age band are always collected. */
export const OPTIONAL_PERSONAL_FIELDS = ['name', 'tehsil', 'district'] as const;
export type OptionalPersonalField = (typeof OPTIONAL_PERSONAL_FIELDS)[number];

export const ADMIN_ROLES = ['owner', 'analyst', 'author'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const DATA_REQUEST_TYPES = [
  'access',
  'correction',
  'erasure',
  'withdrawal',
  'grievance',
  'nomination',
] as const;
export type DataRequestType = (typeof DATA_REQUEST_TYPES)[number];


export const DATA_REQUEST_STATUSES = ['open', 'in_progress', 'resolved', 'rejected'] as const;
export type DataRequestStatus = (typeof DATA_REQUEST_STATUSES)[number];

export const OTP_PURPOSES = ['guardian_consent', 'data_rights'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** Internal service-level target for answering rights requests and grievances. */
export const DATA_REQUEST_SLA_DAYS = 30;

/** Bump whenever the participant-facing privacy notice text changes. */
export const NOTICE_VERSION = '1.0';

export const MIN_RETENTION_DAYS = 30;
export const MAX_RETENTION_DAYS = 730;
