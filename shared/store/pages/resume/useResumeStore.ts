import { create } from "zustand";
import { errorToast, successToast } from "@/shared/helper/toast";
import {
	resolveErrorMessage,
	resolveResponseMessage,
} from "@/shared/helper/apiMessages";
import axios from "axios";
import { apiClient } from "@/lib/apiClient";

export const BackendApiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || undefined,
});
export interface IResume {
	id: string;
	name: string;
	file_type: string;
	link: string;
	created_at: string;
	updated_at: string;
	auto_invited?: boolean;
	auto_shortlisted?: boolean;
	auto_denied?: boolean;
	resume_analysis?: {
		score: number;
		recommendation: string;
	} | null;
	structured_name?: string | null;
	structured_email?: string | null;
}

export interface IPaginationMeta {
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
}

export type ResumeStats = {
	shortlisted: number;
	denied: number;
};

interface IresumeStore {
	resumes: IResume[];
	meta: IPaginationMeta | null;
	resumeStats: ResumeStats;
	loadingGetResumes: boolean;
	hasLoadedResumes: boolean;
	loadingProcessResumes: boolean;
	uploadStatus: "idle" | "uploading" | "completed" | "failed";
	uploadTotal: number;
	uploadUploaded: number;
	uploadFailed: number;
	lastUploadError: string | null;
	actionLoading: {
		id: string | number;
		type: "deny" | "shortlist" | "invite" | "ai-call";
	} | null;
	getResumeStats: (accountId: number | string | string) => Promise<void>;
	getResumes: (
		partial_matching: string,
		sort_by: string,
		sort_order: string,
		page: number,
		accountId: number | string,
		recommendation?: string | null,
		score?: string | number | null,
		jobId?: number | null,
		autoInvited?: boolean | null,
		autoShortlisted?: boolean | null,
		autoDenied?: boolean | null
	) => Promise<void>;
	processResumes: (
		files: File[],
		jobId: number,
		accountId: number | string,
		aiPrompt?: string,
		callbacks?: {
			onComplete?: () => void;
			onFailed?: (message: string | null) => void;
		}
	) => Promise<number>;
	enhanceResumeAiPrompt: (
		prompt: string,
		accountId: number | string,
		jobId?: number
	) => Promise<string | null>;
	loadingEnhanceAiPrompt: boolean;
	resetUploadState: (accountId: number | string) => void;
	denyResume: (
		id: string | number,
		value: boolean,
		accountId: number | string
	) => Promise<void>;
	shortlistResume: (
		id: string | number,
		value: boolean,
		accountId: number | string
	) => Promise<void>;
	inviteResume: (
		id: string | number,
		accountId: number | string
	) => Promise<void>;
	scheduleAiCall: (
		id: string | number,
		accountId: number | string,
		scheduledAt?: string | null
	) => Promise<void>;
}

// Fetches a short-lived agency JWT from the server (JWT_ACCESS_SECRET lives server-side only).
export const getAgencyToken = async (
	accountId: number | string
): Promise<string | null> => {
	try {
		const response = await apiClient.post("/api/agency-token", {
			account_id: Number(accountId),
		});
		return (response.data?.token as string) ?? null;
	} catch {
		return null;
	}
};

export const useResumeStore = create<IresumeStore>((set) => ({
	resumes: [],
	meta: null,
	resumeStats: { shortlisted: 0, denied: 0 },
	loadingGetResumes: false,
	hasLoadedResumes: false,
	loadingProcessResumes: false,
	loadingEnhanceAiPrompt: false,
	uploadStatus: "idle",
	uploadTotal: 0,
	uploadUploaded: 0,
	uploadFailed: 0,
	lastUploadError: null,
	actionLoading: null,
	getResumeStats: async (accountId: number | string) => {
		const token = await getAgencyToken(accountId);
		if (!token) return;
		try {
			const [shortlistRes, deniedRes] = await Promise.all([
				BackendApiClient.get("/resume", {
					headers: { Authorization: `Bearer ${token}` },
					params: { auto_shortlisted: true, limit: 1, page: 1 },
				}),
				BackendApiClient.get("/resume", {
					headers: { Authorization: `Bearer ${token}` },
					params: { auto_denied: true, limit: 1, page: 1 },
				}),
			]);
			set({
				resumeStats: {
					shortlisted: shortlistRes.data?.meta?.total ?? 0,
					denied: deniedRes.data?.meta?.total ?? 0,
				},
			});
		} catch {}
	},
	getResumes: async (
		partial_matching: string,
		sort_by: string,
		sort_order: string,
		page: number,
		accountId: number | string,
		recommendation?: string | null,
		score?: string | number | null,
		jobId?: number | null,
		autoInvited?: boolean | null,
		autoShortlisted?: boolean | null,
		autoDenied?: boolean | null
	) => {
		set({ loadingGetResumes: true });
		const params: Record<string, unknown> = {
			partial_matching,
			sort_by,
			sort_order,
			page,
			limit: 15,
		};
		if (recommendation) params.recommendation = recommendation;
		const scoreValue =
			typeof score === "string"
				? score.trim() === ""
					? null
					: Number(score)
				: score;
		if (typeof scoreValue === "number" && !Number.isNaN(scoreValue))
			params.score = scoreValue;
		if (typeof jobId === "number" && !Number.isNaN(jobId))
			params.job_id = jobId;
		if (typeof autoInvited === "boolean") params.auto_invited = autoInvited;
		if (typeof autoShortlisted === "boolean")
			params.auto_shortlisted = autoShortlisted;
		if (typeof autoDenied === "boolean") params.auto_denied = autoDenied;
		const token = await getAgencyToken(accountId);
		if (!token) {
			set({ loadingGetResumes: false });
			return;
		}
		const response = await BackendApiClient.get("/resume", {
			headers: { Authorization: `Bearer ${token}` },
			params,
		});
		set({
			resumes: response.data?.data ?? [],
			meta: response.data?.meta ?? null,
			loadingGetResumes: false,
			hasLoadedResumes: true,
		});
	},
	processResumes: async (
		files: File[],
		jobId: number,
		accountId: number | string,
		aiPrompt?: string,
		callbacks?: {
			onComplete?: () => void;
			onFailed?: (message: string | null) => void;
		}
	) => {
		const { onComplete, onFailed } = callbacks ?? {};
		set({ loadingProcessResumes: true });
		try {
			const token = await getAgencyToken(accountId);
			if (!token) return 401;
			const chunkSize = 5;
			const concurrency = 6;
			const maxRetries = 3;
			const baseDelayMs = 500;
			set({
				uploadStatus: "uploading",
				uploadTotal: files.length,
				uploadUploaded: 0,
				uploadFailed: 0,
				lastUploadError: null,
			});
			const chunks: File[][] = [];
			for (let i = 0; i < files.length; i += chunkSize)
				chunks.push(files.slice(i, i + chunkSize));
			const uploadChunk = async (chunk: File[]) => {
				const formData = new FormData();
				chunk.forEach((file) => formData.append("resumes", file));
				formData.append("job_id", String(jobId));
				if (aiPrompt) formData.append("ai_prompt", aiPrompt);
				const response = await BackendApiClient.post(
					"/resume/process",
					formData,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				return response.status;
			};
			const sleep = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms));
			const uploadWithRetry = async (chunk: File[]) => {
				let attempt = 0;
				while (attempt <= maxRetries) {
					try {
						const status = await uploadChunk(chunk);
						if (status !== 201)
							throw new Error(`Upload failed with status ${status}`);
						return true;
					} catch (error) {
						if (attempt === maxRetries) throw error;
						const delay =
							baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 150);
						await sleep(delay);
						attempt += 1;
					}
				}
				return false;
			};
			const runQueue = async () => {
				let failedCount = 0;
				let lastErrorMessage: string | null = null;
				let cursor = 0;
				const workers = Array.from({ length: concurrency }, async () => {
					while (cursor < chunks.length) {
						const current = chunks[cursor];
						cursor += 1;
						try {
							await uploadWithRetry(current);
							set((state) => ({
								uploadUploaded: state.uploadUploaded + current.length,
							}));
						} catch (error) {
							lastErrorMessage =
								(error as Error)?.message ?? "Upload failed. Please retry.";
							failedCount += current.length;
							set((state) => ({
								uploadFailed: state.uploadFailed + current.length,
								lastUploadError: lastErrorMessage,
							}));
						}
					}
				});
				await Promise.all(workers);
				const finalStatus = failedCount > 0 ? "failed" : "completed";
				set({ uploadStatus: finalStatus, loadingProcessResumes: false });
				if (finalStatus === "completed") onComplete?.();
				else onFailed?.(lastErrorMessage);
			};
			void runQueue();
			return 202;
		} finally {
			set((state) =>
				state.uploadStatus === "uploading"
					? state
					: { loadingProcessResumes: false }
			);
		}
	},
	resetUploadState: () =>
		set({
			uploadStatus: "idle",
			uploadTotal: 0,
			uploadUploaded: 0,
			uploadFailed: 0,
			lastUploadError: null,
		}),
	enhanceResumeAiPrompt: async (
		prompt: string,
		accountId: number | string,
		jobId?: number
	) => {
		const token = await getAgencyToken(accountId);
		if (!token) return null;
		set({ loadingEnhanceAiPrompt: true });
		try {
			const response = await BackendApiClient.post(
				"/resume/ai/enhance-prompt",
				{ prompt, ...(jobId ? { job_id: jobId } : {}) },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			return (response.data?.data?.enhanced as string | undefined) ?? null;
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Couldn't enhance the prompt."));
			return null;
		} finally {
			set({ loadingEnhanceAiPrompt: false });
		}
	},
	denyResume: async (id, value, accountId) => {
		const token = await getAgencyToken(accountId);
		if (!token) return;
		set({ actionLoading: { id, type: "deny" } });
		try {
			const response = await BackendApiClient.patch(
				`/resume/${id}/deny`,
				{ auto_denied: value },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const updated = response.data?.data ?? null;
			if (updated)
				set((state) => ({
					resumes: state.resumes.map((r) =>
						String(r.id) === String(updated.id) ? { ...r, ...updated } : r
					),
				}));
			successToast(
				resolveResponseMessage(
					response,
					value
						? "Resume denied successfully."
						: "Resume denial removed successfully."
				)
			);
			// Refresh counts
			useResumeStore.getState().getResumeStats(accountId);
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Failed to update resume."));
		} finally {
			set({ actionLoading: null });
		}
	},
	shortlistResume: async (id, value, accountId) => {
		const token = await getAgencyToken(accountId);
		if (!token) return;
		set({ actionLoading: { id, type: "shortlist" } });
		try {
			const response = await BackendApiClient.patch(
				`/resume/${id}/shortlist`,
				{ auto_shortlisted: value },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const updated = response.data?.data ?? null;
			if (updated)
				set((state) => ({
					resumes: state.resumes.map((r) =>
						String(r.id) === String(updated.id) ? { ...r, ...updated } : r
					),
				}));
			successToast(
				resolveResponseMessage(
					response,
					value
						? "Resume shortlisted successfully."
						: "Resume removed from shortlist successfully."
				)
			);
			// Refresh counts
			useResumeStore.getState().getResumeStats(accountId);
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Failed to update resume."));
		} finally {
			set({ actionLoading: null });
		}
	},
	inviteResume: async (id, accountId) => {
		const token = await getAgencyToken(accountId);
		if (!token) return;
		set({ actionLoading: { id, type: "invite" } });
		try {
			const response = await BackendApiClient.post(
				`/resume/${id}/invite`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const updated = response.data?.data ?? null;
			if (updated)
				set((state) => ({
					resumes: state.resumes.map((r) =>
						String(r.id) === String(updated.id) ? { ...r, ...updated } : r
					),
				}));
			successToast(
				resolveResponseMessage(response, "Invitation sent successfully.")
			);
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Failed to send invitation."));
		} finally {
			set({ actionLoading: null });
		}
	},
	scheduleAiCall: async (
		id: string | number,
		accountId: number | string,
		scheduledAt?: string | null
	) => {
		const token = await getAgencyToken(accountId);
		if (!token) return;
		set({ actionLoading: { id, type: "ai-call" } });
		try {
			const response = await BackendApiClient.post(
				`/resume/${id}/ai-call`,
				scheduledAt ? { scheduledAt } : {},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			successToast(
				resolveResponseMessage(response, "AI call scheduled successfully.")
			);
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Failed to schedule AI call."));
		} finally {
			set({ actionLoading: null });
		}
	},
}));
