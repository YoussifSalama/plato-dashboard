import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import { errorToast, successToast } from "@/shared/helper/toast";
import { resolveErrorMessage, resolveResponseMessage } from "@/shared/helper/apiMessages";

export type ResumeAnalysisStrength = {
    title: string;
    description?: string;
    evidence?: string;
    job_relevance?: string;
    ai_opinion?: string;
    impact?: "HIGH" | "MEDIUM" | "LOW";
};

export type ResumeAnalysisGap = {
    title: string;
    description?: string;
    evidence?: string;
    job_relevance?: string;
    ai_opinion?: string;
    job_requirement?: string;
    why_gap?: string;
    impact?: "CRITICAL" | "MAJOR" | "MINOR";
    trainable?: boolean;
    ramp_up?: string;
    recommendation?: string;
    workaround?: string | null;
};

export type ResumeAnalysisRedFlag = {
    title?: string;
    type?: string;
    severity?: "HIGH" | "MEDIUM" | "LOW";
    job_relevance?: string;
    ai_opinion?: string;
    description?: string;
    evidence?: string;
};

export type ResumeAnalysisTopHighlight = {
    title: string;
    description?: string;
    evidence?: string;
    job_relevance?: string;
    ai_opinion?: string;
};

export type ResumeAnalysisReview = {
    description?: string | null;
    top_strength?: ResumeAnalysisTopHighlight | string | null;
    top_concern?: ResumeAnalysisTopHighlight | string | null;
    dealbreakers?: string[];
};

export type ResumeAnalysisSkillItem = {
    skill: string;
    evidence?: string;
    job_relevance?: string;
    ai_opinion?: string;
};

export type ResumeAnalysisGroupedSkills = {
    matched?: {
        direct_match?: ResumeAnalysisSkillItem[];
        semantic_match?: ResumeAnalysisSkillItem[];
    } | null;
    missing?: ResumeAnalysisSkillItem[];
} | null;

export type ResumeAnalysisExperienceItem = {
    role?: string;
    company?: string;
    start?: string;
    end?: string;
    description?: string;
    explanation?: string;
    duration?: string;
};

export type ResumeAnalysisGroupedExperience = {
    total_experience?: ResumeAnalysisExperienceItem[];
    domain_experience?: ResumeAnalysisExperienceItem[];
    job_time_frame?: ResumeAnalysisExperienceItem[];
} | null;

export type ResumeAnalysisAchievement = {
    achievement?: string;
    metric?: string;
    category?: "REVENUE" | "EFFICIENCY" | "SCALE" | "QUALITY" | "LEADERSHIP" | "OTHER";
};

export type ResumeAnalysisSkillDepth = {
    skill: string;
    depth: "expert" | "proficient" | "familiar" | "listed_only" | "missing";
    evidence?: string | null;
    required_by_job?: boolean;
};

export type ResumeAnalysisDomainMatch = {
    job_domain?: string;
    candidate_domain?: string;
    overlap_score?: number;
    crossover_skills?: string[];
    domain_gaps?: string[];
    ramp_up_time?: "immediate" | "1-2 months" | "3-6 months" | "6+ months";
    transition_success?: "high" | "medium" | "low";
    verdict?: string;
};

export type ResumeAnalysisExperienceValidation = {
    total_verified_months?: number | null;
    undated_roles?: string[];
    gaps_detected?: string[];
    meets_experience_requirement?: boolean | null;
    tenure_pattern?: "STABLE" | "CONCERNING" | "INSUFFICIENT_DATA";
};

export type ResumeAnalysis = {
    score: number;
    job_type?: "TECHNICAL" | "SOFT_SKILL" | "ACADEMIC_CERTIFICATION" | null;
    score_breakdown?: {
        role_fit_and_core_skills?: number;
        experience_impact?: number;
        performance_productivity?: number;
        retention_engagement_indicators?: number;
        leadership_collaboration?: number;
        education_certifications?: number;
        projects_initiative?: number;
    } | null;
    dealbreakers?: string[];
    seniority_level?: string | null;
    seniority_fit?: "UNDERQUALIFIED" | "MATCHED" | "OVERQUALIFIED" | null;
    recommendation: string;
    confidence?: "LOW" | "MEDIUM" | "HIGH" | null;
    risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
    summary?: string | null;
    profile_tagline?: string | null;
    fit_label?: string | null;
    recommendation_label?: string | null;
    confidence_label?: string | null;
    risk_label?: string | null;
    top_strength?: ResumeAnalysisTopHighlight | string | null;
    top_concern?: ResumeAnalysisTopHighlight | string | null;
    review?: ResumeAnalysisReview | null;
    skills?: ResumeAnalysisGroupedSkills;
    experience?: ResumeAnalysisGroupedExperience;
    quantified_achievements?: ResumeAnalysisAchievement[];
    analysis_summary_paragraph?: string | null;
    strengths?: ResumeAnalysisStrength[];
    gaps?: ResumeAnalysisGap[];
    insights?: {
        strengths?: (string | ResumeAnalysisStrength)[];
        weaknesses?: string[];
        gaps?: ResumeAnalysisGap[];
    } | null;
    red_flags?: ResumeAnalysisRedFlag[] | null;
    skill_depth?: ResumeAnalysisSkillDepth[] | null;
    matched_skills?: string[];
    missing_skills?: string[];
    matched_technical_skills?: string[];
    missing_technical_skills?: string[];
    matched_soft_skills?: string[];
    missing_soft_skills?: string[];
    strengths_count?: number;
    gaps_count?: number;
    matched_count?: number;
    missing_count?: number;
    domain_match?: ResumeAnalysisDomainMatch | null;
    experience_validation?: ResumeAnalysisExperienceValidation | null;
} | null;

export type ResumeStructured = {
    name?: string | null;
    contact?: {
        email?: string | null;
        phone?: string | null;
        linkedin?: string | null;
        github?: string | null;
        portfolio?: string | null;
    };
    location?: {
        city?: string | null;
        country?: string | null;
    };
    current_title?: string | null;
    total_experience_years?: number | null;
    education?: Array<{
        degree?: string | null;
        institution?: string | null;
        year?: number | null;
        country?: string | null;
        gpa?: string | null;
    }>;
    experience?: Array<{
        title?: string | null;
        company?: string | null;
        start_year?: number | null;
        end_year?: number | "Present" | null;
        start_month?: number | null;
        end_month?: number | null;
        highlights?: string[];
    }>;
    skills?: string[];
    tools?: string[];
    certifications?: Array<{
        name?: string | null;
        issuer?: string | null;
        year?: number | null;
    }>;
    languages?: string[];
    languages_detailed?: Array<{
        name?: string | null;
        level?: string | null;
    }>;
    projects?: Array<{
        name?: string | null;
        description?: string | null;
        tech?: string[];
    }>;
};

export type ResumeDetails = {
    id: number;
    name: string;
    link: string;
    created_at: string;
    auto_denied?: boolean;
    auto_shortlisted?: boolean;
    auto_invited?: boolean;
    job?: { title?: string } | null;
    resume_structured?: {
        data?: ResumeStructured | null;
        email?: string | null;
        phone?: string | null;
        current_title?: string | null;
        city?: string | null;
        country?: string | null;
        total_experience_years?: number | null;
        languages?: string[];
        language_levels?: string[];
        top_degree?: string | null;
        top_institution?: string | null;
        education_country?: string | null;
        education_gpa?: string | null;
    } | null;
    resume_analysis?: ResumeAnalysis;
    application?: {
        documents: Array<{
            id: number;
            name: string;
            link: string;
        }>;
    } | null;
};

interface ResumeDetailsStore {
    resume: ResumeDetails | null;
    loading: boolean;
    error: string | null;
    actionLoading: "deny" | "shortlist" | "invite" | null;
    getResume: (id: number | string) => Promise<void>;
    denyResume: (id: number | string, value: boolean) => Promise<void>;
    shortlistResume: (id: number | string, value: boolean) => Promise<void>;
    inviteResume: (id: number | string) => Promise<void>;
    clear: () => void;
}

const getToken = () => {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

const asString = (value: unknown): string | undefined =>
    typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
    typeof value === "number" ? value : undefined;

const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const asObject = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const safeParseJson = (value: unknown): unknown => {
    if (typeof value === "string") {
        try { return JSON.parse(value); } catch { return value; }
    }
    return value;
};

const normalizeTopHighlight = (value: unknown): ResumeAnalysisTopHighlight | string | null => {
    const parsed = safeParseJson(value);
    if (!parsed) return null;
    if (typeof parsed === "string") return parsed || null;
    const obj = asObject(parsed);
    if (!obj) return null;
    if (typeof obj.title === "string" || typeof obj.description === "string") {
        return {
            title: asString(obj.title) ?? "",
            description: asString(obj.description) ?? "",
            evidence: asString(obj.evidence) ?? "",
            job_relevance: asString(obj.job_relevance) ?? "",
            ai_opinion: asString(obj.ai_opinion) ?? "",
        };
    }
    return null;
};

const normalizeStrengths = (value: unknown): ResumeAnalysisStrength[] => {
    const parsed = safeParseJson(value);
    return asArray(parsed).reduce<ResumeAnalysisStrength[]>((acc, item) => {
        if (typeof item === "string") {
            acc.push({ title: item });
            return acc;
        }
        const record = asObject(item);
        if (!record) return acc;
        const title = asString(record.title) ?? asString(record.name);
        if (!title) return acc;
        acc.push({
            title,
            description: asString(record.description),
            evidence: asString(record.evidence),
            job_relevance: asString(record.job_relevance),
            ai_opinion: asString(record.ai_opinion),
        });
        return acc;
    }, []);
};

const normalizeGaps = (value: unknown): ResumeAnalysisGap[] => {
    const parsed = safeParseJson(value);
    return asArray(parsed).reduce<ResumeAnalysisGap[]>((acc, item) => {
        const record = asObject(item);
        if (!record) return acc;
        const title = asString(record.title) ?? asString(record.why_gap) ?? asString(record.job_requirement) ?? "Gap";
        acc.push({
            title,
            description: asString(record.description),
            evidence: asString(record.evidence),
            job_relevance: asString(record.job_relevance),
            ai_opinion: asString(record.ai_opinion),
            job_requirement: asString(record.job_requirement),
            why_gap: asString(record.why_gap),
        });
        return acc;
    }, []);
};

const normalizeRedFlags = (value: unknown): ResumeAnalysisRedFlag[] => {
    const parsed = safeParseJson(value);
    return asArray(parsed).reduce<ResumeAnalysisRedFlag[]>((acc, item) => {
        const record = asObject(item);
        if (!record) return acc;
        acc.push({
            title: asString(record.title),
            type: asString(record.type),
            severity: asString(record.severity) as ResumeAnalysisRedFlag["severity"],
            job_relevance: asString(record.job_relevance),
            ai_opinion: asString(record.ai_opinion),
            description: asString(record.description),
            evidence: asString(record.evidence),
        });
        return acc;
    }, []);
};

const normalizeSkillItems = (value: unknown): ResumeAnalysisSkillItem[] =>
    asArray(safeParseJson(value)).reduce<ResumeAnalysisSkillItem[]>((acc, item) => {
        const record = asObject(item);
        if (!record) return acc;
        const skill = asString(record.skill) ?? asString(record.name);
        if (!skill) return acc;
        acc.push({
            skill,
            evidence: asString(record.evidence),
            job_relevance: asString(record.job_relevance ?? record.jobRelevance),
            ai_opinion: asString(record.ai_opinion ?? record.aiOpinion),
        });
        return acc;
    }, []);

const normalizeSkillDepth = (value: unknown): ResumeAnalysisSkillDepth[] =>
    asArray(safeParseJson(value)).reduce<ResumeAnalysisSkillDepth[]>((acc, item) => {
        const record = asObject(item);
        if (!record) return acc;
        const skill = asString(record.skill);
        if (!skill) return acc;
        acc.push({
            skill,
            depth: (asString(record.depth) ?? "listed_only") as ResumeAnalysisSkillDepth["depth"],
            evidence: asString(record.evidence) ?? null,
            required_by_job: Boolean(record.required_by_job),
        });
        return acc;
    }, []);

const normalizeExperienceItems = (value: unknown): ResumeAnalysisExperienceItem[] =>
    asArray(safeParseJson(value)).reduce<ResumeAnalysisExperienceItem[]>((acc, item) => {
        const record = asObject(item);
        if (!record) return acc;
        acc.push({
            role: asString(record.role),
            company: asString(record.company),
            start: asString(record.start),
            end: asString(record.end),
            description: asString(record.description),
            explanation: asString(record.explanation),
            duration: asString(record.duration),
        });
        return acc;
    }, []);

type ResumeAnalysisModel = NonNullable<ResumeAnalysis>;

const normalizeResumeResponse = (raw: unknown): ResumeDetails | null => {
    const root = asObject(raw);
    if (!root) return null;

    const analysisRaw = asObject(root.resume_analysis);
    const insightsRaw = asObject(analysisRaw?.insights);
    const reviewRaw = asObject(safeParseJson(analysisRaw?.review));
    const groupedSkillsRaw = asObject(safeParseJson(analysisRaw?.skills));
    const groupedSkillsMatchedRaw = asObject(groupedSkillsRaw?.matched);
    const groupedExperienceRaw = asObject(safeParseJson(analysisRaw?.experience));
    const domainMatchRaw = asObject(safeParseJson(analysisRaw?.domain_match ?? analysisRaw?.domainMatch));
    const experienceValidationRaw = asObject(safeParseJson(analysisRaw?.experience_validation ?? analysisRaw?.experienceValidation));

    const scoreBreakdown =
        asObject(analysisRaw?.score_breakdown) ??
        asObject(analysisRaw?.scoreBreakdown) ??
        asObject(insightsRaw?.score_breakdown);

    const topStrengthNorm = normalizeTopHighlight(
        reviewRaw?.top_strength ?? analysisRaw?.top_strength ?? analysisRaw?.topStrength
    );
    const topConcernNorm = normalizeTopHighlight(
        reviewRaw?.top_concern ?? analysisRaw?.top_concern ?? analysisRaw?.topConcern
    );

    const strengthsNorm = normalizeStrengths(
        Array.isArray(analysisRaw?.strengths) ? analysisRaw?.strengths
            : Array.isArray(insightsRaw?.strengths) ? insightsRaw?.strengths
                : []
    );

    const gapsNorm = normalizeGaps(
        Array.isArray(analysisRaw?.gaps) ? analysisRaw?.gaps
            : Array.isArray(insightsRaw?.gaps) ? insightsRaw?.gaps
                : []
    );

    const redFlagsNorm = normalizeRedFlags(analysisRaw?.red_flags ?? analysisRaw?.redFlags);
    const skillDepthNorm = normalizeSkillDepth(analysisRaw?.skill_depth ?? analysisRaw?.skillDepth);

    const directMatchItems = normalizeSkillItems(groupedSkillsMatchedRaw?.direct_match);
    const semanticMatchItems = normalizeSkillItems(groupedSkillsMatchedRaw?.semantic_match);
    const missingSkillItems = normalizeSkillItems(groupedSkillsRaw?.missing);

    const matchedTechnicalSkills = Array.from(new Set([
        ...asStringArray(analysisRaw?.matched_technical_skills),
        ...asStringArray(analysisRaw?.matched_skills ?? analysisRaw?.matchedSkills),
        ...directMatchItems.map((i) => i.skill),
        ...semanticMatchItems.map((i) => i.skill),
    ]));

    const missingTechnicalSkills = Array.from(new Set([
        ...asStringArray(analysisRaw?.missing_technical_skills),
        ...asStringArray(analysisRaw?.missing_skills ?? analysisRaw?.missingSkills),
        ...missingSkillItems.map((i) => i.skill),
    ]));

    const normalizedAnalysis = analysisRaw
        ? ({
            score: asNumber(analysisRaw.score) ?? 0,
            job_type: asString(analysisRaw.job_type) as ResumeAnalysisModel["job_type"],
            score_breakdown: scoreBreakdown as ResumeAnalysisModel["score_breakdown"],
            dealbreakers: asStringArray(reviewRaw?.dealbreakers ?? analysisRaw.dealbreakers),
            seniority_level: asString(analysisRaw.seniority_level ?? analysisRaw.seniorityLevel) ?? null,
            seniority_fit: asString(analysisRaw.seniority_fit ?? analysisRaw.seniorityFit) as ResumeAnalysisModel["seniority_fit"],
            recommendation: asString(analysisRaw.recommendation) ?? "consider",
            confidence: asString(analysisRaw.confidence) as ResumeAnalysisModel["confidence"],
            risk_level: asString(analysisRaw.risk_level ?? analysisRaw.riskLevel) as ResumeAnalysisModel["risk_level"],
            summary: asString(analysisRaw.summary) ?? null,
            profile_tagline: asString(analysisRaw.profile_tagline ?? analysisRaw.profileTagline) ?? null,
            fit_label: asString(analysisRaw.fit_label ?? analysisRaw.fitLabel) ?? null,
            recommendation_label: asString(analysisRaw.recommendation_label ?? analysisRaw.recommendationLabel) ?? null,
            confidence_label: asString(analysisRaw.confidence_label ?? analysisRaw.confidenceLabel) ?? null,
            risk_label: asString(analysisRaw.risk_label ?? analysisRaw.riskLabel) ?? null,
            top_strength: topStrengthNorm,
            top_concern: topConcernNorm,
            review: {
                description: asString(reviewRaw?.description ?? analysisRaw.summary) ?? null,
                top_strength: topStrengthNorm,
                top_concern: topConcernNorm,
                dealbreakers: asStringArray(reviewRaw?.dealbreakers ?? analysisRaw.dealbreakers),
            },
            skills: groupedSkillsRaw
                ? {
                    matched: {
                        direct_match: directMatchItems,
                        semantic_match: semanticMatchItems,
                    },
                    missing: missingSkillItems,
                }
                : null,
            experience: groupedExperienceRaw
                ? {
                    total_experience: normalizeExperienceItems(groupedExperienceRaw.total_experience),
                    domain_experience: normalizeExperienceItems(groupedExperienceRaw.domain_experience),
                    job_time_frame: normalizeExperienceItems(groupedExperienceRaw.job_time_frame),
                }
                : null,
            quantified_achievements: asArray(safeParseJson(analysisRaw.quantified_achievements)).reduce<ResumeAnalysisAchievement[]>(
                (acc, item) => {
                    const record = asObject(item);
                    if (!record) return acc;
                    acc.push({
                        achievement: asString(record.achievement),
                        metric: asString(record.metric),
                        category: asString(record.category) as ResumeAnalysisAchievement["category"],
                    });
                    return acc;
                },
                [],
            ),
            analysis_summary_paragraph: asString(analysisRaw.analysis_summary_paragraph) ?? null,
            strengths: strengthsNorm,
            gaps: gapsNorm,
            insights: {
                strengths: strengthsNorm,
                weaknesses: asStringArray(insightsRaw?.weaknesses),
                gaps: gapsNorm,
            },
            red_flags: redFlagsNorm,
            skill_depth: skillDepthNorm,
            matched_skills: matchedTechnicalSkills,
            missing_skills: missingTechnicalSkills,
            matched_technical_skills: matchedTechnicalSkills,
            missing_technical_skills: missingTechnicalSkills,
            matched_soft_skills: asStringArray(analysisRaw.matched_soft_skills),
            missing_soft_skills: asStringArray(analysisRaw.missing_soft_skills),
            strengths_count: asNumber(analysisRaw.strengths_count ?? analysisRaw.strengthsCount) ?? strengthsNorm.length,
            gaps_count: asNumber(analysisRaw.gaps_count ?? analysisRaw.gapsCount) ?? gapsNorm.length,
            matched_count: asNumber(analysisRaw.matched_count ?? analysisRaw.matchedCount) ?? matchedTechnicalSkills.length,
            missing_count: asNumber(analysisRaw.missing_count ?? analysisRaw.missingCount) ?? missingTechnicalSkills.length,
            domain_match: (domainMatchRaw as ResumeAnalysisDomainMatch | null) ?? null,
            experience_validation: (experienceValidationRaw as ResumeAnalysisExperienceValidation | null) ?? null,
        } satisfies ResumeAnalysisModel)
        : null;

    return {
        id: asNumber(root.id) ?? 0,
        name: asString(root.name) ?? "Unknown resume",
        link: asString(root.link) ?? "",
        created_at: asString(root.created_at) ?? "",
        auto_denied: Boolean(root.auto_denied),
        auto_shortlisted: Boolean(root.auto_shortlisted),
        auto_invited: Boolean(root.auto_invited),
        job: asObject(root.job) ? { title: asString(asObject(root.job)?.title) } : null,
        resume_structured: asObject(root.resume_structured)
            ? {
                data: (asObject(asObject(root.resume_structured)?.data) as ResumeStructured | null) ?? null,
                email: asString(asObject(root.resume_structured)?.email) ?? null,
                phone: asString(asObject(root.resume_structured)?.phone) ?? null,
                current_title: asString(asObject(root.resume_structured)?.current_title) ?? null,
                city: asString(asObject(root.resume_structured)?.city) ?? null,
                country: asString(asObject(root.resume_structured)?.country) ?? null,
                total_experience_years: asNumber(asObject(root.resume_structured)?.total_experience_years) ?? null,
                languages: asStringArray(asObject(root.resume_structured)?.languages),
                language_levels: asStringArray(asObject(root.resume_structured)?.language_levels),
                top_degree: asString(asObject(root.resume_structured)?.top_degree) ?? null,
                top_institution: asString(asObject(root.resume_structured)?.top_institution) ?? null,
                education_country: asString(asObject(root.resume_structured)?.education_country) ?? null,
                education_gpa: asString(asObject(root.resume_structured)?.education_gpa) ?? null,
            }
            : null,
        resume_analysis: normalizedAnalysis as ResumeAnalysis,
    };
};

export const useResumeDetailsStore = create<ResumeDetailsStore>((set) => ({
    resume: null,
    loading: false,
    error: null,
    actionLoading: null,
    getResume: async (id: number | string) => {
        const rawId = typeof id === "string" ? id.trim() : id;
        const parsedId = typeof rawId === "string" ? Number.parseInt(rawId, 10) : rawId;
        const requestId = Number.isFinite(parsedId) ? parsedId : rawId;
        set({ loading: true, error: null });
        try {
            const token = getToken();
            if (!token) {
                set({ resume: null, loading: false, error: "Unauthorized" });
                return;
            }
            const response = await apiClient.get(`/resume/single/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ resume: normalizeResumeResponse(response.data?.data), loading: false });
        } catch {
            set({
                resume: null,
                loading: false,
                error: Number.isFinite(parsedId) ? "Resume not found" : "Invalid resume id",
            });
        }
    },
    denyResume: async (id: number | string, value: boolean) => {
        const token = getToken();
        if (!token) return;
        const requestId = typeof id === "string" ? id.trim() : id;
        set({ actionLoading: "deny" });
        try {
            const response = await apiClient.patch(
                `/resume/${requestId}/deny`,
                { auto_denied: value },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const updated = response.data?.data ?? null;
            if (updated) {
                set((state) => ({
                    resume: state.resume ? { ...state.resume, ...updated } : state.resume,
                }));
            }
            successToast(resolveResponseMessage(response, value ? "Resume denied successfully." : "Resume denial removed successfully."));
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to update resume."));
        } finally {
            set({ actionLoading: null });
        }
    },
    shortlistResume: async (id: number | string, value: boolean) => {
        const token = getToken();
        if (!token) return;
        const requestId = typeof id === "string" ? id.trim() : id;
        set({ actionLoading: "shortlist" });
        try {
            const response = await apiClient.patch(
                `/resume/${requestId}/shortlist`,
                { auto_shortlisted: value },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const updated = response.data?.data ?? null;
            if (updated) {
                set((state) => ({
                    resume: state.resume ? { ...state.resume, ...updated } : state.resume,
                }));
            }
            successToast(resolveResponseMessage(response, value ? "Resume shortlisted successfully." : "Resume removed from shortlist successfully."));
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to update resume."));
        } finally {
            set({ actionLoading: null });
        }
    },
    inviteResume: async (id: number | string) => {
        const token = getToken();
        if (!token) return;
        const requestId = typeof id === "string" ? id.trim() : id;
        set({ actionLoading: "invite" });
        try {
            const response = await apiClient.post(
                `/resume/${requestId}/invite`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const updated = response.data?.data ?? null;
            if (updated) {
                set((state) => ({
                    resume: state.resume ? { ...state.resume, ...updated } : state.resume,
                }));
            }
            successToast(resolveResponseMessage(response, "Invitation sent successfully."));
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to send invitation."));
        } finally {
            set({ actionLoading: null });
        }
    },
    clear: () => set({ resume: null, loading: false, error: null }),
}));