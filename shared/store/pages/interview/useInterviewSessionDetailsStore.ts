import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

type UnknownRecord = Record<string, unknown>;

export type InterviewProfileExperience = {
    id: number;
    company_name: string;
    role: string;
    field: string;
    type: string;
    description?: string | null;
    from?: string | null;
    to?: string | null;
    current?: boolean | null;
};

export type InterviewProfileProject = {
    id: number;
    name: string;
    role: string;
    description?: string | null;
};

export type InterviewProfileSocialLink = {
    id: number;
    key: string;
    value: string;
};

export type InterviewCandidateProfile = {
    avatar?: string | null;
    resume_link?: string | null;
    resume_parsed?: Record<string, unknown> | null;
    headline?: string | null;
    summary?: string | null;
    location?: string | null;
    experiences?: InterviewProfileExperience[];
    projects?: InterviewProfileProject[];
    social_links?: InterviewProfileSocialLink[];
};

export type InterviewCandidateDetails = {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    profile?: InterviewCandidateProfile | null;
};

export type InterviewSessionJobDetails = {
    id: number;
    title: string | null;
    description: string | null;
};

export type InterviewSessionResumeDetails = {
    id: number;
    name: string | null;
    link: string | null;
    file_type?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    resume_analysis?: {
        score?: number | null;
        seniority_level?: string | null;
        recommendation?: string | null;
        insights?: Record<string, unknown> | null;
        createdAt?: string | null;
    } | null;
};

export type InterviewInvitationTokenDetails = {
    status: string;
    revoked: boolean;
    expires_at: string;
};

export type InterviewSessionQaLogEntry = {
    question: string;
    answer: string;
};

export type InterviewGeneratedProfileEvidenceItem = {
    item: string | null;
    note: string | null;
    prove: string | null;
};

export type InterviewGeneratedProfileFlag = {
    trigger: string | null;
    note: string | null;
    prove: string | null;
};

export type InterviewGeneratedProfileVerifiedSkill = {
    skill: string | null;
    note: string | null;
    prove: string | null;
};

export type InterviewGeneratedProfileGapConcernFlag = {
    type: string | null;
    item: string | null;
    note: string | null;
    prove: string | null;
};

export type InterviewGeneratedProfileUnverifiedClaim = {
    claim: string | null;
    source: string | null;
    note: string | null;
};

export type InterviewGeneratedProfileFocusItem = {
    area: string | null;
    reason: string | null;
};

export type InterviewGeneratedProfileReasonItem = {
    point: string | null;
    prove: string | null;
};

export type InterviewGeneratedProfileSnapshot = {
    name: string | null;
    applying_for: string | null;
    company: string | null;
    interview_date: string | null;
    interview_duration_minutes: number | null;
    employment_status: string | null;
    current_employer: string | null;
    current_role: string | null;
    years_of_experience: number | null;
    candidate_punctuality: string | null;
    interview_completion_status: string | null;
    language_of_interview: string | null;
};

export type InterviewGeneratedProfileSnapshotProves = {
    current_role: string | null;
    current_employer: string | null;
    employment_status: string | null;
    years_of_experience: string | null;
    candidate_punctuality: string | null;
    language_of_interview: string | null;
};

export type InterviewGeneratedProfileLogistics = {
    current_salary: number | null;
    expected_salary: number | null;
    salary_flexibility: string | null;
    current_city: string | null;
    open_to_relocation: boolean | null;
    notice_period: string | null;
    earliest_start_date: string | null;
};

export type InterviewGeneratedProfileDimensionScores = {
    technical_skills: number | null;
    experience: number | null;
    resume_integrity: number | null;
    logistics_fit: number | null;
    all: number | null;
};

export type InterviewGeneratedProfileEvaluation = {
    scores: InterviewGeneratedProfileDimensionScores;
    overall_summary: string | null;
    highlights: {
        strengths: InterviewGeneratedProfileEvidenceItem[];
        weaknesses: InterviewGeneratedProfileEvidenceItem[];
        verified_skills: InterviewGeneratedProfileVerifiedSkill[];
        gaps_concerns_flags: InterviewGeneratedProfileGapConcernFlag[];
    };
    unverified_claims: InterviewGeneratedProfileUnverifiedClaim[];
    flags: {
        green: InterviewGeneratedProfileFlag[];
    };
    decision_support: {
        overall_verdict: string | null;
        recommended_next_step: string | null;
        suggested_interview_focus: InterviewGeneratedProfileFocusItem[];
    };
    role_fit: {
        role_fit_summary: string | null;
        seniority_fit: string | null;
    };
    risk: {
        flight_risk: {
            level: string | null;
            color: string | null;
            note: string | null;
            prove: string | null;
        };
        onboarding_complexity: {
            level: string | null;
            color: string | null;
            note: string | null;
            prove: string | null;
            factors: string[];
        };
    };
};

export type InterviewGeneratedProfileRecommendationBlock = {
    summary: string | null;
    reasoning: {
        for: InterviewGeneratedProfileReasonItem[];
        against: InterviewGeneratedProfileReasonItem[];
    };
    risks: {
        flight_risk: string | null;
        onboarding_complexity: string | null;
        notes: string | null;
    };
};

export type InterviewGeneratedCandidateProfile = {
    candidate_snapshot: InterviewGeneratedProfileSnapshot;
    snapshot_proves: InterviewGeneratedProfileSnapshotProves | null;
    evaluation_summary: InterviewGeneratedProfileEvaluation;
    recruiter_recommendation: {
        verdict: string | null;
        seniority_fit: string | null;
        next_step: string | null;
        internal: InterviewGeneratedProfileRecommendationBlock;
    };
    logistics: InterviewGeneratedProfileLogistics;
};

export type InterviewGeneratedProfile = {
    candidate_profile: InterviewGeneratedCandidateProfile;
};

export type InterviewSessionDetails = {
    id: number;
    status: string;
    language?: string | null;
    record?: string | null;
    qa_log?: InterviewSessionQaLogEntry[];
    generated_profile_status?:
        | "not_started"
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | null;
    generated_profile?: InterviewGeneratedProfile | null;
    generated_profile_error?: string | null;
    generated_profile_generated_at?: string | null;
    created_at: string;
    updated_at: string;
    invitation_token: InterviewInvitationTokenDetails | null;
    job: InterviewSessionJobDetails | null;
    resume: InterviewSessionResumeDetails | null;
    candidate: InterviewCandidateDetails | null;
};

type InterviewSessionDetailsStore = {
    session: InterviewSessionDetails | null;
    loading: boolean;
    generating: boolean;
    error: string | null;
    getSession: (id: number | string) => Promise<void>;
    generateProfileNow: (id: number | string) => Promise<boolean>;
    clear: () => void;
};

const getToken = () => {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

const asRecord = (value: unknown): UnknownRecord | null =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;

const asString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown): boolean | null =>
    typeof value === "boolean" ? value : null;

const asStringArray = (value: unknown): string[] =>
    Array.isArray(value)
        ? value
            .map((entry) => (typeof entry === "string" && entry.trim() ? entry.trim() : null))
            .filter((entry): entry is string => Boolean(entry))
        : [];

const normalizeQaLogEntry = (value: unknown): InterviewSessionQaLogEntry => {
    const entry = asRecord(value);
    return {
        question: typeof entry?.question === "string" ? entry.question : "",
        answer: typeof entry?.answer === "string" ? entry.answer : "",
    };
};

const normalizeEvidenceItem = (value: unknown): InterviewGeneratedProfileEvidenceItem => {
    const item = asRecord(value);
    return {
        item: asString(item?.item),
        note: asString(item?.note),
        prove: asString(item?.prove),
    };
};

const normalizeFlag = (value: unknown): InterviewGeneratedProfileFlag => {
    const flag = asRecord(value);
    return {
        trigger: asString(flag?.trigger),
        note: asString(flag?.note),
        prove: asString(flag?.prove),
    };
};

const normalizeVerifiedSkill = (value: unknown): InterviewGeneratedProfileVerifiedSkill => {
    const item = asRecord(value);
    return {
        skill: asString(item?.skill),
        note: asString(item?.note),
        prove: asString(item?.prove),
    };
};

const normalizeGapConcernFlag = (value: unknown): InterviewGeneratedProfileGapConcernFlag => {
    const item = asRecord(value);
    return {
        type: asString(item?.type),
        item: asString(item?.item),
        note: asString(item?.note),
        prove: asString(item?.prove),
    };
};

const normalizeUnverifiedClaim = (value: unknown): InterviewGeneratedProfileUnverifiedClaim => {
    const item = asRecord(value);
    return {
        claim: asString(item?.claim),
        source: asString(item?.source),
        note: asString(item?.note),
    };
};

const normalizeFocusItem = (value: unknown): InterviewGeneratedProfileFocusItem => {
    if (typeof value === "string") {
        return { area: value.trim() || null, reason: null };
    }
    const item = asRecord(value);
    return {
        area: asString(item?.area ?? item?.item),
        reason: asString(item?.reason ?? item?.note),
    };
};

const normalizeReasonItem = (value: unknown): InterviewGeneratedProfileReasonItem => {
    const item = asRecord(value);
    return {
        point: asString(item?.point ?? item?.item),
        prove: asString(item?.prove),
    };
};

const normalizeArray = <T>(value: unknown, mapper: (entry: unknown) => T): T[] =>
    Array.isArray(value) ? value.map(mapper) : [];

const normalizeRecommendationBlock = (value: unknown): InterviewGeneratedProfileRecommendationBlock => {
    const block = asRecord(value);
    const reasoning = asRecord(block?.reasoning);
    const risks = asRecord(block?.risks);
    return {
        summary: asString(block?.summary),
        reasoning: {
            for: normalizeArray(reasoning?.for, normalizeReasonItem),
            against: normalizeArray(reasoning?.against, normalizeReasonItem),
        },
        risks: {
            flight_risk: asString(risks?.flight_risk),
            onboarding_complexity: asString(risks?.onboarding_complexity),
            notes: asString(risks?.notes),
        },
    };
};

export const normalizeGeneratedProfile = (value: unknown): InterviewGeneratedProfile | null => {
    const source = asRecord(value);
    if (!source) return null;

    const candidateProfile = asRecord(source.candidate_profile) ?? source;
    if (!candidateProfile) return null;

    const snapshotRaw = asRecord(candidateProfile.candidate_snapshot);

    // Helper: extract value+prove from new { value, prove } fields, or plain value (old schema)
    const extractSnapshotFact = <T>(raw: unknown, cast: (v: unknown) => T | null): { value: T | null; prove: string | null } => {
        const obj = asRecord(raw);
        if (obj && "value" in obj) return { value: cast(obj.value), prove: asString(obj.prove) };
        return { value: cast(raw), prove: null };
    };

    const snapshotCurrentRole = extractSnapshotFact(snapshotRaw?.current_role, asString);
    const snapshotCurrentEmployer = extractSnapshotFact(snapshotRaw?.current_employer, asString);
    const snapshotEmploymentStatus = extractSnapshotFact(snapshotRaw?.employment_status, asString);
    const snapshotYearsOfExperience = extractSnapshotFact(snapshotRaw?.years_of_experience, asNumber);
    const snapshotCandidatePunctuality = extractSnapshotFact(snapshotRaw?.candidate_punctuality, asString);
    const snapshotLanguageOfInterview = extractSnapshotFact(snapshotRaw?.language_of_interview, asString);

    const snapshot = snapshotRaw;
    const evaluation = asRecord(candidateProfile.evaluation_summary);
    const scores = asRecord(evaluation?.scores);
    const highlightsSource = asRecord(evaluation?.highlights);
    const flags = asRecord(evaluation?.flags);
    const decisionSupport = asRecord(evaluation?.decision_support);
    const roleFit = asRecord(evaluation?.role_fit);
    const risk = asRecord(evaluation?.risk);
    const flightRisk = asRecord(risk?.flight_risk);
    const onboardingComplexity = asRecord(risk?.onboarding_complexity);
    const recommendation = asRecord(candidateProfile.recruiter_recommendation);

    // Logistics: try top-level first (new schema), fall back to snapshot.logistics (old schema)
    const logisticsSource = asRecord(candidateProfile.logistics) ?? asRecord(snapshot?.logistics as unknown);

    // Highlights: try new structure first, fall back to old flat arrays for backward compat
    const normalizedStrengths = highlightsSource
        ? normalizeArray(highlightsSource.strengths, normalizeEvidenceItem)
        : normalizeArray(evaluation?.strengths, normalizeEvidenceItem);

    const normalizedWeaknesses = highlightsSource
        ? normalizeArray(highlightsSource.weaknesses, normalizeEvidenceItem)
        : normalizeArray(evaluation?.weaknesses, normalizeEvidenceItem);

    const normalizedVerifiedSkills = normalizeArray(
        highlightsSource?.verified_skills,
        normalizeVerifiedSkill
    );

    // gaps_concerns_flags: new merged array, or fall back to merged old concerns+gaps+flags.red
    const normalizedGapsConcernsFlags: InterviewGeneratedProfileGapConcernFlag[] = highlightsSource
        ? normalizeArray(highlightsSource.gaps_concerns_flags, normalizeGapConcernFlag)
        : [
            ...normalizeArray(evaluation?.concerns, (v) => {
                const i = asRecord(v);
                return { type: "concern", item: asString(i?.item), note: asString(i?.note), prove: asString(i?.prove) };
            }),
            ...normalizeArray(evaluation?.gaps, (v) => {
                const i = asRecord(v);
                return { type: "gap", item: asString(i?.item), note: asString(i?.note), prove: asString(i?.prove) };
            }),
            ...normalizeArray(asRecord(evaluation?.flags)?.red, (v) => {
                const f = asRecord(v);
                return { type: "red_flag", item: asString(f?.trigger), note: asString(f?.note), prove: asString(f?.prove) };
            }),
        ];

    return {
        candidate_profile: {
            candidate_snapshot: {
                name: asString(snapshot?.name),
                applying_for: asString(snapshot?.applying_for),
                company: asString(snapshot?.company),
                interview_date: asString(snapshot?.interview_date),
                interview_duration_minutes: asNumber(snapshot?.interview_duration_minutes),
                employment_status: snapshotEmploymentStatus.value,
                current_employer: snapshotCurrentEmployer.value,
                current_role: snapshotCurrentRole.value,
                years_of_experience: snapshotYearsOfExperience.value,
                candidate_punctuality: snapshotCandidatePunctuality.value,
                interview_completion_status: asString(snapshot?.interview_completion_status),
                language_of_interview: snapshotLanguageOfInterview.value,
            },
            snapshot_proves: {
                current_role: snapshotCurrentRole.prove,
                current_employer: snapshotCurrentEmployer.prove,
                employment_status: snapshotEmploymentStatus.prove,
                years_of_experience: snapshotYearsOfExperience.prove,
                candidate_punctuality: snapshotCandidatePunctuality.prove,
                language_of_interview: snapshotLanguageOfInterview.prove,
            },
            evaluation_summary: {
                scores: {
                    technical_skills: asNumber(scores?.technical_skills),
                    experience: asNumber(scores?.experience),
                    resume_integrity: asNumber(scores?.resume_integrity),
                    logistics_fit: asNumber(scores?.logistics_fit),
                    all: asNumber(scores?.all),
                },
                overall_summary: asString(evaluation?.overall_summary),
                highlights: {
                    strengths: normalizedStrengths,
                    weaknesses: normalizedWeaknesses,
                    verified_skills: normalizedVerifiedSkills,
                    gaps_concerns_flags: normalizedGapsConcernsFlags,
                },
                unverified_claims: normalizeArray(evaluation?.unverified_claims, normalizeUnverifiedClaim),
                flags: {
                    green: normalizeArray(flags?.green, normalizeFlag),
                },
                decision_support: {
                    overall_verdict: asString(decisionSupport?.overall_verdict),
                    recommended_next_step: asString(decisionSupport?.recommended_next_step),
                    suggested_interview_focus: normalizeArray(
                        decisionSupport?.suggested_interview_focus,
                        normalizeFocusItem
                    ),
                },
                role_fit: {
                    role_fit_summary: asString(roleFit?.role_fit_summary),
                    seniority_fit: asString(roleFit?.seniority_fit),
                },
                risk: {
                    flight_risk: {
                        level: asString(flightRisk?.level),
                        color: asString(flightRisk?.color),
                        note: asString(flightRisk?.note),
                        prove: asString(flightRisk?.prove),
                    },
                    onboarding_complexity: {
                        level: asString(onboardingComplexity?.level),
                        color: asString(onboardingComplexity?.color),
                        note: asString(onboardingComplexity?.note),
                        prove: asString(onboardingComplexity?.prove),
                        factors: asStringArray(onboardingComplexity?.factors),
                    },
                },
            },
            recruiter_recommendation: {
                verdict: asString(recommendation?.verdict),
                seniority_fit: asString(recommendation?.seniority_fit),
                next_step: asString(recommendation?.next_step),
                internal: normalizeRecommendationBlock(recommendation?.internal),
            },
            logistics: {
                current_salary: asNumber(logisticsSource?.current_salary),
                expected_salary: asNumber(logisticsSource?.expected_salary),
                salary_flexibility: asString(logisticsSource?.salary_flexibility),
                current_city: asString(logisticsSource?.current_city),
                open_to_relocation: asBoolean(logisticsSource?.open_to_relocation),
                notice_period: asString(logisticsSource?.notice_period),
                earliest_start_date: asString(logisticsSource?.earliest_start_date),
            },
        },
    };
};

export const useInterviewSessionDetailsStore = create<InterviewSessionDetailsStore>((set) => ({
    session: null,
    loading: false,
    generating: false,
    error: null,
    getSession: async (id: number | string) => {
        const rawId = typeof id === "string" ? id.trim() : id;
        const parsedId = typeof rawId === "string" ? Number.parseInt(rawId, 10) : rawId;
        const requestId = Number.isFinite(parsedId) ? parsedId : rawId;
        set({ loading: true, error: null });
        try {
            const token = getToken();
            if (!token) {
                set({ session: null, loading: false, error: "Unauthorized" });
                return;
            }
            const response = await apiClient.get(`/interview/sessions/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = asRecord(response.data?.data);
            const normalizedSession = payload
                ? ({
                    ...payload,
                    record: asString(payload.record),
                    qa_log: Array.isArray(payload.qa_log)
                        ? payload.qa_log
                            .map(normalizeQaLogEntry)
                            .filter((entry) => entry.question || entry.answer)
                        : [],
                    generated_profile: normalizeGeneratedProfile(payload.generated_profile),
                } as InterviewSessionDetails)
                : null;
            set({ session: normalizedSession, loading: false });
        } catch {
            set({
                session: null,
                loading: false,
                error: Number.isFinite(parsedId)
                    ? "Interview session not found"
                    : "Invalid session id",
            });
        }
    },
    generateProfileNow: async (id: number | string) => {
        const rawId = typeof id === "string" ? id.trim() : id;
        const parsedId = typeof rawId === "string" ? Number.parseInt(rawId, 10) : rawId;
        const requestId = Number.isFinite(parsedId) ? parsedId : rawId;
        set({ generating: true, error: null });
        try {
            const token = getToken();
            if (!token) {
                set({ generating: false, error: "Unauthorized" });
                return false;
            }
            await apiClient.post(
                `/interview/sessions/${requestId}/generate-profile`,
                undefined,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            set({ generating: false });
            return true;
        } catch {
            set({
                generating: false,
                error: Number.isFinite(parsedId)
                    ? "Unable to generate profile right now."
                    : "Invalid session id",
            });
            return false;
        }
    },
    clear: () => set({ session: null, loading: false, generating: false, error: null }),
}));
