import type {
  AdminRole,
  CampaignStatus,
  ConsentMethod,
  DataRequestStatus,
  DataRequestType,
  GuardianRelation,
  OptionalPersonalField,
  QuestionType,
  ResultsVisibility,
  ScoringMode,
} from '@sajag/shared';

/** Hindi display labels for every shared enum — the only place UI copy for codes lives. */
export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: 'एक सही उत्तर',
  multi: 'कई सही उत्तर',
  true_false: 'सही / गलत',
  text: 'खुला उत्तर (बिना अंक)',
};

export const SCORING_LABEL: Record<ScoringMode, string> = {
  partial: 'आंशिक अंक',
  all_or_nothing: 'सभी सही होने पर ही',
};

export const STATUS_LABEL: Record<CampaignStatus, string> = { draft: 'ड्राफ़्ट', live: 'जारी', closed: 'बंद' };

export const RESULTS_VISIBILITY_LABEL: Record<ResultsVisibility, string> = {
  immediate: 'जमा करते ही',
  after_close: 'अभियान समाप्ति पर',
  hidden: 'नहीं दिखाएँ',
};

export const FIELD_LABEL: Record<OptionalPersonalField, string> = { name: 'पूरा नाम', tehsil: 'तहसील', district: 'ज़िला' };

export const RELATION_LABEL: Record<GuardianRelation, string> = { mother: 'माता', father: 'पिता', legal_guardian: 'कानूनी अभिभावक' };

export const CONSENT_METHOD_LABEL: Record<ConsentMethod, string> = {
  self: 'स्वयं',
  guardian_declared: 'अभिभावक · घोषणा',
  guardian_otp: 'अभिभावक · OTP',
  guardian_digilocker: 'अभिभावक · DigiLocker',
};

export const REQUEST_TYPE_LABEL: Record<DataRequestType, string> = {
  access: 'जानकारी देखना',
  correction: 'सुधार',
  erasure: 'मिटाना',
  withdrawal: 'सहमति वापसी',
  grievance: 'शिकायत',
  nomination: 'नामांकन',
};

export const REQUEST_STATUS_LABEL: Record<DataRequestStatus, string> = {
  open: 'खुला',
  in_progress: 'प्रगति में',
  resolved: 'पूर्ण',
  rejected: 'अस्वीकृत',
};

export const ROLE_LABEL: Record<AdminRole, string> = { owner: 'स्वामी', analyst: 'विश्लेषक', author: 'प्रश्न लेखक' };

/** Turns a Record<code, label> into option lists for chips/selects. */
export function optionsOf<T extends string>(labels: Record<T, string>): Array<{ value: T; label: string }> {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
