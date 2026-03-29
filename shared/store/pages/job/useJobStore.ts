import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import { errorToast, successToast } from "@/shared/helper/toast";
import { resolveErrorMessage, resolveResponseMessage } from "@/shared/helper/apiMessages";
import type { IResume, IPaginationMeta } from "@/shared/store/pages/resume/useResumeStore";

export type JobListItem = {
    id: number;
    title: string;
    workplace_type: string;
    employment_type: string;
    seniority_level: string;
    industry: string;
    location: string;
    is_active: boolean;
    effective_is_active?: boolean;
    inactive_reason?: "manual_inactive" | "auto_deactivated" | null;
    is_auto_deactivated?: boolean;
    auto_deactivate_at?: string;
    created_at?: string;
};

export type JobPaginationMeta = {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    current_page: number;
    next_page: number | null;
    previous_page: number | null;
    has_next_page: boolean;
    has_previous_page: boolean;
    is_first_page: boolean;
    is_last_page: boolean;
};

export type CreateJobPayload = {
    title: string;
    workplace_type: string;
    employment_type: string;
    seniority_level: string;
    industry: string;
    location: string;
    auto_deactivate_at: string;
    salary_currency: string;
    salary_from: number;
    salary_to: number;
    is_salary_negotiable?: boolean;
    description: string;
    requirements: string;
    certifications?: string;
    required_documents?: string;
    company_overview?: string;
    role_overview?: string;
    responsibilities?: string;
    nice_to_have?: string;
    what_we_offer?: string;
    job_benefits?: string;
    auto_score_matching_threshold?: number;
    auto_email_invite_threshold?: number;
    auto_shortlisted_threshold?: number;
    auto_denied_threshold?: number;
    soft_skills?: string[];
    technical_skills?: string[];
    languages?: ("ar" | "en")[];
};

export type GenerateJobAiPayload = {
    title: string;
    seniority_level: string;
    industry: string;
    employment_type: string;
    workplace_type: string;
    location: string;
    technical_skills?: string[];
    soft_skills?: string[];
    target?: "description" | "requirements" | "both";
};

export type CreateJobAiPromptPayload = {
    target: string;
    prompt: string;
    evaluation: { key: string; value: string }[];
};

export type JobAiPrompt = {
    id: number;
    target: string;
    prompt: string;
    evaluation?: unknown;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type JobDetail = JobListItem & {
    auto_score_matching_threshold?: number | null;
    auto_email_invite_threshold?: number | null;
    auto_shortlisted_threshold?: number | null;
    auto_denied_threshold?: number | null;
    salary_currency: string;
    salary_from: number;
    salary_to: number;
    is_salary_negotiable: boolean;
    description: string;
    requirements: string;
    certifications: string;
    required_documents?: string | null;
    company_overview?: string | null;
    role_overview?: string | null;
    responsibilities?: string | null;
    nice_to_have?: string | null;
    what_we_offer?: string | null;
    job_benefits?: string | null;
    soft_skills: string[];
    technical_skills: string[];
    languages: ("ar" | "en")[];
    jobAiPrompt?: JobAiPrompt | null;
};

export type JobApplication = {
    id: number;
    candidate_id: number;
    job_id: number;
    resume_id: number;
    created_at: string;
    updated_at: string;
    candidate: {
        id: number;
        f_name: string;
        l_name: string;
        email: string;
        phone: string;
        profile: {
            avatar: string | null;
            headline: string;
            location: string;
        };
    };
    resume: {
        id: number;
        name: string;
        link: string;
        file_type: string;
        created_at: string;
        resume_analysis?: {
            score: number;
            recommendation: string;
        } | null;
    };
    job: {
        title: string;
    };
};

export type JobSearchOption = {
    id: number;
    title: string;
    created_at?: string;
};

interface IJobStore {
    jobs: JobListItem[];
    job: JobDetail | null;
    jobSearchResults: JobSearchOption[];
    jobResumes: IResume[];
    jobResumesMeta: IPaginationMeta | null;
    meta: JobPaginationMeta | null;
    loadingJobs: boolean;
    hasLoadedJobs: boolean;
    loadingJob: boolean;
    loadingJobResumes: boolean;
    loadingCreateJob: boolean;
    loadingUpdateJob: boolean;
    loadingCreatePrompt: boolean;
    loadingUpsertPrompt: boolean;
    loadingGenerateDescription: boolean;
    loadingGenerateRequirements: boolean;
    loadingToggleActive: boolean;
    loadingJobSearch: boolean;
    loadingDeleteJob: boolean;
    jobApplications: JobApplication[];
    loadingJobApplications: boolean;
    resumeActionLoading: { id: number | string; type: "deny" | "shortlist" | "invite" | "ai-call" } | null;
    getJobs: (
        partial_matching: string,
        sort_by: string,
        sort_order: string,
        page: number,
        is_active?: boolean | null,
        industry?: string | null,
        accessToken?: string | null
    ) => Promise<void>;
    searchJobs: (partial_matching: string, accessToken?: string | null) => Promise<void>;
    getJobById: (id: number, accessToken?: string | null) => Promise<JobDetail | null>;
    getJobResumes: (
        id: number,
        partial_matching: string,
        sort_by: string,
        sort_order: string,
        page: number,
        recommendation?: string | null,
        score?: string | number | null,
        autoInvited?: boolean | null,
        autoShortlisted?: boolean | null,
        autoDenied?: boolean | null,
        accessToken?: string | null
    ) => Promise<void>;
    denyJobResume: (id: number | string, value: boolean, accessToken?: string | null) => Promise<void>;
    shortlistJobResume: (id: number | string, value: boolean, accessToken?: string | null) => Promise<void>;
    inviteJobResume: (id: number | string, accessToken?: string | null) => Promise<void>;
    scheduleJobResumeAiCall: (id: number | string, scheduledAt?: string | null, accessToken?: string | null) => Promise<void>;
    createJob: (payload: CreateJobPayload, accessToken?: string | null) => Promise<JobListItem | null>;
    updateJob: (id: number, payload: CreateJobPayload, accessToken?: string | null) => Promise<JobDetail | null>;
    deleteJob: (id: number, accessToken?: string | null) => Promise<boolean>;
    setJobActiveStatus: (id: number, isActive: boolean, accessToken?: string | null) => Promise<boolean>;
    createJobAiPrompt: (payload: CreateJobAiPromptPayload, accessToken?: string | null) => Promise<boolean>;
    upsertJobAiPrompt: (id: number, payload: CreateJobAiPromptPayload, accessToken?: string | null) => Promise<boolean>;
    generateJobContent: (
        payload: GenerateJobAiPayload,
        accessToken?: string | null
    ) => Promise<{ description: string; requirements: string } | null>;
    getJobApplications: (id: number, accessToken?: string | null) => Promise<void>;
    sendDirectInterview: (candidateId: number, jobId: number, resumeId: number, accessToken?: string | null) => Promise<void>;
}

const getToken = (accessToken?: string | null) => {
    if (accessToken) return accessToken;
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

export const useJobStore = create<IJobStore>((set, get) => ({
    jobs: [],
    job: null,
    jobSearchResults: [],
    jobResumes: [],
    jobResumesMeta: null,
    meta: null,
    loadingJobs: false,
    hasLoadedJobs: false,
    loadingJob: false,
    loadingJobResumes: false,
    loadingCreateJob: false,
    loadingUpdateJob: false,
    loadingCreatePrompt: false,
    loadingUpsertPrompt: false,
    loadingGenerateDescription: false,
    loadingGenerateRequirements: false,
    loadingToggleActive: false,
    loadingJobSearch: false,
    loadingDeleteJob: false,
    jobApplications: [],
    loadingJobApplications: false,
    resumeActionLoading: null,
    getJobs: async (partial_matching, sort_by, sort_order, page, is_active, industry, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ loadingJobs: true });
        try {
            const params: Record<string, unknown> = {
                partial_matching,
                sort_by,
                sort_order,
                page,
                limit: 10,
            };
            if (typeof is_active === "boolean") {
                params.is_active = is_active;
            }
            const response = await apiClient.get("/agency/jobs", {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            let jobs = (response.data?.data ?? response.data ?? []) as JobListItem[];
            const meta = (response.data?.meta ?? null) as JobPaginationMeta | null;

            // Fallback: If the backend doesn't support the 'industry' filter yet, filter it locally
            if (industry && industry !== "all") {
                const targetIndustry = String(industry).toLowerCase().trim();
                jobs = jobs.filter(j => {
                    const jobIndustry = j.industry ? String(j.industry).toLowerCase().trim() : "undefined";
                    return jobIndustry === targetIndustry;
                });
            }

            set({ jobs, meta, hasLoadedJobs: true });
        } catch {
            set({ hasLoadedJobs: true });
        } finally {
            set({ loadingJobs: false });
        }
    },
    searchJobs: async (partial_matching, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ loadingJobSearch: true });
        try {
            const response = await apiClient.get("/agency/jobs/search", {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    partial_matching,
                    limit: 10,
                },
            });
            const results = (response.data?.data ?? response.data ?? []) as JobSearchOption[];
            set({ jobSearchResults: results });
        } catch {
        } finally {
            set({ loadingJobSearch: false });
        }
    },
    getJobById: async (id, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return null;
        set({ loadingJob: true });
        try {
            const response = await apiClient.get(`/agency/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const job = (response.data?.data ?? response.data) as JobDetail;
            set({ job });
            return job;
        } catch {
            return null;
        } finally {
            set({ loadingJob: false });
        }
    },
    getJobResumes: async (
        id,
        partial_matching,
        sort_by,
        sort_order,
        page,
        recommendation,
        score,
        autoInvited,
        autoShortlisted,
        autoDenied,
        accessToken
    ) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ loadingJobResumes: true });
        try {
            const params: Record<string, unknown> = {
                partial_matching,
                sort_by,
                sort_order,
                page,
                limit: 15,
            };
            if (recommendation) {
                params.recommendation = recommendation;
            }
            const scoreValue =
                typeof score === "string"
                    ? score.trim() === ""
                        ? null
                        : Number(score)
                    : score;
            if (typeof scoreValue === "number" && !Number.isNaN(scoreValue)) {
                params.score = scoreValue;
            }
            if (typeof autoInvited === "boolean") {
                params.auto_invited = autoInvited;
            }
            if (typeof autoShortlisted === "boolean") {
                params.auto_shortlisted = autoShortlisted;
            }
            if (typeof autoDenied === "boolean") {
                params.auto_denied = autoDenied;
            }
            const response = await apiClient.get(`/agency/jobs/${id}/resumes`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            const jobResumes = (response.data?.data ?? response.data ?? []) as IResume[];
            const jobResumesMeta = (response.data?.meta ?? null) as IPaginationMeta | null;
            set({ jobResumes, jobResumesMeta });
        } catch {
        } finally {
            set({ loadingJobResumes: false });
        }
    },
    denyJobResume: async (id, value, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ resumeActionLoading: { id, type: "deny" } });
        try {
            const response = await apiClient.patch(
                `/resume/${id}/deny`,
                { auto_denied: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updated = response.data?.data ?? null;
            if (updated) {
                set((state) => ({
                    jobResumes: state.jobResumes.map((resume) =>
                        String(resume.id) === String(updated.id)
                            ? { ...resume, ...updated }
                            : resume
                    ),
                }));
            }
            successToast(
                resolveResponseMessage(
                    response,
                    value ? "Resume denied successfully." : "Resume denial removed successfully."
                )
            );
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to update resume."));
        } finally {
            set({ resumeActionLoading: null });
        }
    },
    shortlistJobResume: async (id, value, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ resumeActionLoading: { id, type: "shortlist" } });
        try {
            const response = await apiClient.patch(
                `/resume/${id}/shortlist`,
                { auto_shortlisted: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updated = response.data?.data ?? null;
            if (updated) {
                set((state) => ({
                    jobResumes: state.jobResumes.map((resume) =>
                        String(resume.id) === String(updated.id)
                            ? { ...resume, ...updated }
                            : resume
                    ),
                }));
            }
            successToast(
                resolveResponseMessage(
                    response,
                    value ? "Resume shortlisted successfully." : "Resume removed from shortlist successfully."
                )
            );
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to update resume."));
        } finally {
            set({ resumeActionLoading: null });
        }
    },
    inviteJobResume: async (id, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ resumeActionLoading: { id, type: "invite" } });
        try {
            const response = await apiClient.post(
                `/resume/${id}/invite`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updated = response.data?.data ?? null;
            if (updated) {
                set((state) => ({
                    jobResumes: state.jobResumes.map((resume) =>
                        String(resume.id) === String(updated.id)
                            ? { ...resume, ...updated }
                            : resume
                    ),
                }));
            }
            successToast(resolveResponseMessage(response, "Invitation sent successfully."));
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to send invitation."));
        } finally {
            set({ resumeActionLoading: null });
        }
    },
    scheduleJobResumeAiCall: async (id, scheduledAt, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ resumeActionLoading: { id, type: "ai-call" } });
        try {
            const response = await apiClient.post(
                `/resume/${id}/ai-call`,
                scheduledAt ? { scheduledAt } : {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            successToast(resolveResponseMessage(response, "AI call scheduled successfully."));
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to schedule AI call."));
        } finally {
            set({ resumeActionLoading: null });
        }
    },
    createJob: async (payload, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return null;
        set({ loadingCreateJob: true });
        try {
            const response = await apiClient.post("/agency/jobs", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const job = (response.data?.data ?? response.data) as JobListItem;
            const nextJobs = [job, ...get().jobs];
            set({ jobs: nextJobs });
            successToast(resolveResponseMessage(response, "Job created successfully."));
            return job;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't create the job."));
            return null;
        } finally {
            set({ loadingCreateJob: false });
        }
    },
    updateJob: async (id, payload, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return null;
        set({ loadingUpdateJob: true });
        try {
            const response = await apiClient.patch(`/agency/jobs/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const job = (response.data?.data ?? response.data) as JobDetail;
            set({ job });
            successToast(resolveResponseMessage(response, "Job updated successfully."));
            return job;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't update the job."));
            return null;
        } finally {
            set({ loadingUpdateJob: false });
        }
    },
    deleteJob: async (id, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return false;
        set({ loadingDeleteJob: true });
        try {
            const response = await apiClient.delete(`/agency/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set((state) => ({
                jobs: state.jobs.filter((job) => job.id !== id),
            }));
            successToast(resolveResponseMessage(response, "Job deleted successfully."));
            return true;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't delete the job."));
            return false;
        } finally {
            set({ loadingDeleteJob: false });
        }
    },
    setJobActiveStatus: async (id, isActive, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return false;
        set({ loadingToggleActive: true });
        try {
            const endpoint = isActive ? "activate" : "inactivate";
            const response = await apiClient.patch(
                `/agency/jobs/${id}/${endpoint}`,
                null,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const job = (response.data?.data ?? response.data) as JobDetail;
            set({ job });
            successToast(
                resolveResponseMessage(
                    response,
                    isActive ? "Job activated." : "Job inactivated."
                )
            );
            return true;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't update job status."));
            return false;
        } finally {
            set({ loadingToggleActive: false });
        }
    },
    createJobAiPrompt: async (payload, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return false;
        set({ loadingCreatePrompt: true });
        try {
            const response = await apiClient.post("/agency/job-ai-prompts", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            successToast(resolveResponseMessage(response, "AI prompt saved successfully."));
            return true;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't save the AI prompt."));
            return false;
        } finally {
            set({ loadingCreatePrompt: false });
        }
    },
    upsertJobAiPrompt: async (id, payload, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return false;
        set({ loadingUpsertPrompt: true });
        try {
            const response = await apiClient.post(`/agency/jobs/${id}/ai-prompt`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            successToast(resolveResponseMessage(response, "AI prompt saved successfully."));
            return true;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't save the AI prompt."));
            return false;
        } finally {
            set({ loadingUpsertPrompt: false });
        }
    },
    generateJobContent: async (payload, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return null;
        const target = payload.target ?? "both";
        if (target === "description") {
            set({ loadingGenerateDescription: true });
        } else if (target === "requirements") {
            set({ loadingGenerateRequirements: true });
        } else {
            set({ loadingGenerateDescription: true, loadingGenerateRequirements: true });
        }
        try {
            const response = await apiClient.post("/agency/jobs/ai/generate", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = (response.data?.data ?? response.data ?? {}) as {
                description?: string;
                requirements?: string;
            };
            return {
                description: data.description ?? "",
                requirements: data.requirements ?? "",
            };
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't generate job content."));
            return null;
        } finally {
            if (target === "description") {
                set({ loadingGenerateDescription: false });
            } else if (target === "requirements") {
                set({ loadingGenerateRequirements: false });
            } else {
                set({ loadingGenerateDescription: false, loadingGenerateRequirements: false });
            }
        }
    },
    getJobApplications: async (id, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ loadingJobApplications: true });
        try {
            const response = await apiClient.get(`/agency/jobs/${id}/applications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const applications = (response.data?.data ?? response.data ?? []) as JobApplication[];
            set({ jobApplications: applications });
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to load job applications."));
        } finally {
            set({ loadingJobApplications: false });
        }
    },
    sendDirectInterview: async (candidateId, jobId, resumeId, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ resumeActionLoading: { id: resumeId, type: "invite" } });
        try {
            const response = await apiClient.post(
                `/invitation/direct`,
                { candidate_id: candidateId, job_id: jobId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            successToast(resolveResponseMessage(response, "Invitation sent successfully."));
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Failed to send invitation."));
        } finally {
            set({ resumeActionLoading: null });
        }
    },
}));

