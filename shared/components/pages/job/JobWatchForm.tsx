"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Controller,
	useFieldArray,
	useForm,
	useWatch,
	type SubmitHandler,
	type SubmitErrorHandler,
	type Resolver,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RetraceTextEditor from "@/shared/components/common/RetraceTextEditor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	employmentTypeOptions,
	jobIndustryOptions,
	jobLanguageOptions,
	jobSalaryCurrencyOptions,
	jobSoftSkillsOptions,
	jobTechnicalSkillsOptions,
	seniorityLevelOptions,
	workplaceTypeOptions,
} from "@/shared/core/job/options";
import { warningToast } from "@/shared/helper/toast";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import SkillTagInput from "@/shared/components/pages/job/SkillTagInput";
import { splitList } from "@/shared/components/pages/job/jobFormUtils";
import {
	Award,
	BarChart3,
	Briefcase,
	Building2,
	ClipboardList,
	Code2,
	DollarSign,
	FileText,
	Languages,
	Mail,
	MapPin,
	Sparkles,
	Users,
	XCircle,
	ArrowLeft,
	Plus,
	ChevronLeft,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	Check,
} from "lucide-react";

const numberOrUndefined = (value: unknown) => {
	if (value === "" || value == null) return undefined;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? undefined : parsed;
};

const toDatetimeLocalInput = (value?: string | Date | null) => {
	if (!value) return "";
	const date = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return "";
	const tzOffset = date.getTimezoneOffset() * 60000;
	const local = new Date(date.getTime() - tzOffset);
	return local.toISOString().slice(0, 16);
};

const normalizeLanguageValue = (value: string): "ar" | "en" | null => {
	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (normalized === "ar" || normalized === "arabic") return "ar";
	if (normalized === "en" || normalized === "english") return "en";
	return null;
};

const normalizeLanguages = (values: string[]): ("ar" | "en")[] => {
	const output: ("ar" | "en")[] = [];
	values.forEach((value) => {
		const mapped = normalizeLanguageValue(value);
		if (mapped && !output.includes(mapped)) {
			output.push(mapped);
		}
	});
	return output;
};

const jobSchema = z
	.object({
		title: z.string().min(1, "Job title is required."),
		employment_type: z.string().min(1, "Employment type is required."),
		workplace_type: z.string().min(1, "Workplace type is required."),
		seniority_level: z.string().min(1, "Seniority level is required."),
		industry: z.string().min(1, "Industry is required."),
		location: z.string().min(1, "Location is required."),
		auto_deactivate_at: z.string().min(1, "Auto deactivate date is required."),
		salary_currency: z.string().min(1, "Salary currency is required."),
		salary_from: z.preprocess(numberOrUndefined, z.number().min(0)),
		salary_to: z.preprocess(numberOrUndefined, z.number().min(0)),
		is_salary_negotiable: z.boolean().optional(),
		description: z.string().min(1, "Job description is required."),
		requirements: z.string().min(1, "Job requirements are required."),
		certifications: z.union([z.literal(""), z.string()]).optional(),
		company_overview: z.union([z.literal(""), z.string()]).optional(),
		role_overview: z.union([z.literal(""), z.string()]).optional(),
		responsibilities: z.union([z.literal(""), z.string()]).optional(),
		nice_to_have: z.union([z.literal(""), z.string()]).optional(),
		what_we_offer: z.union([z.literal(""), z.string()]).optional(),
		job_benefits: z.union([z.literal(""), z.string()]).optional(),
		auto_score_matching_threshold: z.preprocess(
			numberOrUndefined,
			z.number().min(0).optional()
		),
		auto_email_invite_threshold: z.preprocess(
			numberOrUndefined,
			z.number().min(0).optional()
		),
		auto_shortlisted_threshold: z.preprocess(
			numberOrUndefined,
			z.number().min(0).optional()
		),
		auto_denied_threshold: z.preprocess(
			numberOrUndefined,
			z.number().min(0).optional()
		),
		soft_skills: z.union([z.literal(""), z.string()]).optional(),
		technical_skills: z.union([z.literal(""), z.string()]).optional(),
		languages: z.union([z.literal(""), z.string()]).optional(),
	})
	.refine((data) => data.salary_from <= data.salary_to, {
		message: "Salary minimum must be less than or equal to salary maximum.",
		path: ["salary_from"],
	});

const aiPromptSchema = z.object({
	target: z.string().min(1, "Target is required."),
	prompt: z.string().min(1, "Prompt is required."),
	evaluation: z
		.array(
			z.object({
				key: z.string().min(1, "Evaluation key is required."),
				value: z.string().min(1, "Evaluation value is required."),
			})
		)
		.min(1, "Add at least one evaluation item."),
});

type JobFormValues = z.infer<typeof jobSchema>;
type AiPromptFormValues = z.input<typeof aiPromptSchema>;

/* ─────────────────── Steps ─────────────────── */
const STEPS = [
	{ label: "Basic Info", subtitle: "Job title and type" },
	{ label: "Thresholds", subtitle: "AI thresholds" },
	{ label: "Compensation", subtitle: "Salary details" },
	{ label: "Description", subtitle: "Job details" },
	{ label: "Skills", subtitle: "Required skills" },
	{ label: "Summary", subtitle: "Review and save" },
] as const;

const TOTAL_STEPS = 6;

/* ─────────────────── Field helper ─────────────────── */
interface FieldProps {
	label: string;
	required?: boolean;
	error?: string;
	children: React.ReactNode;
}
const Field = ({ label, required, error, children }: FieldProps) => (
	<div className="space-y-1.5">
		<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
			{label}
			{required && <span className="ml-0.5 text-red-500"> *</span>}
		</label>
		{children}
		{error && <p className="text-xs text-red-500">{error}</p>}
	</div>
);

const textareaCls =
	"border-0 rounded-[10px] bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm px-4 py-3 resize-none";
const inputCls =
	"border-0 rounded-[10px] bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm h-11 px-4";

const JobWatchForm = () => {
	const searchParams = useSearchParams();
	const jobIdParam = searchParams.get("id");
	const jobId = jobIdParam ? Number(jobIdParam) : NaN;
	const [activeTab, setActiveTab] = useState<"details" | "ai">("details");
	const [currentStep, setCurrentStep] = useState(1);
	const [stepError, setStepError] = useState<string | null>(null);
	const [formReady, setFormReady] = useState(false);
	const {
		job,
		loadingJob,
		loadingUpdateJob,
		loadingToggleActive,
		loadingUpsertPrompt,
		loadingGenerateDescription,
		loadingGenerateRequirements,
		getJobById,
		updateJob: submitJobUpdate,
		setJobActiveStatus,
		upsertJobAiPrompt,
		generateJobContent,
	} = useJobStore();

	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		reset,
		trigger,
		formState: { errors, isValid, isDirty, isSubmitting },
	} = useForm<JobFormValues>({
		defaultValues: {
			title: "",
			employment_type: "",
			workplace_type: "",
			seniority_level: "",
			industry: "",
			location: "",
			auto_deactivate_at: "",
			salary_currency: "",
			salary_from: 0,
			salary_to: 0,
			is_salary_negotiable: false,
			description: "",
			requirements: "",
			certifications: "",
			company_overview: "",
			role_overview: "",
			responsibilities: "",
			nice_to_have: "",
			what_we_offer: "",
			job_benefits: "",
			auto_score_matching_threshold: undefined,
			auto_email_invite_threshold: undefined,
			auto_shortlisted_threshold: undefined,
			auto_denied_threshold: undefined,
			soft_skills: "",
			technical_skills: "",
			languages: "",
		},
		mode: "onChange",
		resolver: zodResolver(jobSchema) as Resolver<JobFormValues>,
	});

	const watchedTitle = useWatch({ control, name: "title" });
	const watchedType = useWatch({ control, name: "employment_type" });
	const watchedLocation = useWatch({ control, name: "location" });
	const watchedSeniority = useWatch({ control, name: "seniority_level" });

	const handleNext = async () => {
		setStepError(null);
		let fieldsToValidate: (keyof JobFormValues)[] = [];

		if (currentStep === 1) {
			fieldsToValidate = [
				"title",
				"employment_type",
				"industry",
				"seniority_level",
				"location",
				"auto_deactivate_at",
			];
		} else if (currentStep === 3) {
			fieldsToValidate = ["salary_currency", "salary_from", "salary_to"];
		} else if (currentStep === 4) {
			fieldsToValidate = ["description", "requirements"];
		}

		const isStepValid = await trigger(fieldsToValidate);
		if (isStepValid) {
			setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
			window.scrollTo({ top: 0, behavior: "smooth" });
		} else {
			setStepError("Please fix the errors before proceeding.");
		}
	};

	const handlePrev = () => {
		setStepError(null);
		setCurrentStep((prev) => Math.max(prev - 1, 1));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const {
		register: registerPrompt,
		handleSubmit: handlePromptSubmit,
		control: promptControl,
		reset: resetPrompt,
		formState: {
			errors: promptErrors,
			isValid: isPromptValid,
			isDirty: isPromptDirty,
		},
	} = useForm<AiPromptFormValues>({
		defaultValues: {
			target: "",
			prompt: "",
			evaluation: [{ key: "", value: "" }],
		},
		mode: "onChange",
		resolver: zodResolver(aiPromptSchema),
	});

	const {
		fields: promptFields,
		append: appendPrompt,
		remove: removePrompt,
	} = useFieldArray({
		control: promptControl,
		name: "evaluation",
	});

	const watchedSoftSkills = useWatch({ control, name: "soft_skills" });
	const watchedTechnicalSkills = useWatch({
		control,
		name: "technical_skills",
	});
	const watchedLanguages = useWatch({ control, name: "languages" });

	const softSkillsList = useMemo(
		() => splitList(watchedSoftSkills),
		[watchedSoftSkills]
	);
	const technicalSkillsList = useMemo(
		() => splitList(watchedTechnicalSkills),
		[watchedTechnicalSkills]
	);
	const languagesList = useMemo(
		() => normalizeLanguages(splitList(watchedLanguages)),
		[watchedLanguages]
	);

	useEffect(() => {
		if (!Number.isFinite(jobId)) return;
		getJobById(jobId);
	}, [getJobById, jobId]);

	useEffect(() => {
		setFormReady(false);
	}, [jobId]);

	useEffect(() => {
		if (!job || !Number.isFinite(jobId) || job.id !== jobId) {
			return;
		}

		reset({
			title: job.title ?? "",
			employment_type: job.employment_type ?? "",
			workplace_type: job.workplace_type ?? "",
			seniority_level: job.seniority_level ?? "",
			industry: job.industry ?? "",
			location: job.location ?? "",
			auto_deactivate_at: toDatetimeLocalInput(job.auto_deactivate_at),
			salary_currency: job.salary_currency ?? "",
			salary_from: job.salary_from ?? 0,
			salary_to: job.salary_to ?? 0,
			is_salary_negotiable: job.is_salary_negotiable ?? false,
			description: job.description ?? "",
			requirements: job.requirements ?? "",
			certifications: job.certifications ?? "",
			company_overview: job.company_overview ?? "",
			role_overview: job.role_overview ?? "",
			responsibilities: job.responsibilities ?? "",
			nice_to_have: job.nice_to_have ?? "",
			what_we_offer: job.what_we_offer ?? "",
			job_benefits: job.job_benefits ?? "",
			auto_score_matching_threshold:
				job.auto_score_matching_threshold ?? undefined,
			auto_email_invite_threshold: job.auto_email_invite_threshold ?? undefined,
			auto_shortlisted_threshold: job.auto_shortlisted_threshold ?? undefined,
			auto_denied_threshold: job.auto_denied_threshold ?? undefined,
			soft_skills: job.soft_skills?.join(", ") ?? "",
			technical_skills: job.technical_skills?.join(", ") ?? "",
			languages: normalizeLanguages((job.languages ?? []) as string[]).join(
				", "
			),
		});
		setFormReady(true);
	}, [job, jobId, reset]);

	useEffect(() => {
		if (!job?.jobAiPrompt) {
			resetPrompt({
				target: "",
				prompt: "",
				evaluation: [{ key: "", value: "" }],
			});
			return;
		}
		resetPrompt({
			target: job.jobAiPrompt.target ?? "",
			prompt: job.jobAiPrompt.prompt ?? "",
			evaluation: (job.jobAiPrompt.evaluation as {
				key: string;
				value: string;
			}[]) ?? [{ key: "", value: "" }],
		});
	}, [job?.jobAiPrompt, resetPrompt]);

	const selectOptions = useMemo(
		() => ({
			employment: employmentTypeOptions,
			workplace: workplaceTypeOptions,
			seniority: seniorityLevelOptions,
			industry: jobIndustryOptions,
			currency: jobSalaryCurrencyOptions,
		}),
		[]
	);

	const buildAiPayload = (target: "description" | "requirements") => {
		const values = getValues();
		return {
			title: values.title?.trim() ?? "",
			seniority_level: values.seniority_level ?? "",
			industry: values.industry ?? "",
			employment_type: values.employment_type ?? "",
			workplace_type: values.workplace_type ?? "",
			location: values.location ?? "",
			technical_skills: technicalSkillsList,
			soft_skills: softSkillsList,
			target,
		};
	};

	const resolveMissingAiFields = () => {
		const values = getValues();
		const missing: string[] = [];
		if (!values.title?.trim()) missing.push("job title");
		if (!values.employment_type) missing.push("employment type");
		if (!values.workplace_type) missing.push("workplace type");
		if (!values.industry) missing.push("industry");
		if (!values.seniority_level) missing.push("seniority level");
		if (!values.location) missing.push("location");
		return missing;
	};

	const handleInvalid: SubmitErrorHandler<JobFormValues> = () => {
		warningToast("Please fix the highlighted errors before submitting.");
	};

	const handleFinalSave = async () => {
		const values = getValues();
		if (currentStep !== TOTAL_STEPS) {
			await handleNext();
			return;
		}

		if (!Number.isFinite(jobId)) return;

		// Perform final validation check before saving
		const isFormValid = await trigger();
		if (!isFormValid) {
			warningToast("Please fix the errors on all steps before saving.");
			return;
		}

		const parsed = jobSchema.parse(values);
		await submitJobUpdate(jobId, {
			title: parsed.title,
			employment_type: parsed.employment_type,
			workplace_type: parsed.workplace_type,
			seniority_level: parsed.seniority_level,
			industry: parsed.industry,
			location: parsed.location,
			auto_deactivate_at: parsed.auto_deactivate_at,
			salary_currency: parsed.salary_currency,
			salary_from: parsed.salary_from,
			salary_to: parsed.salary_to,
			is_salary_negotiable: parsed.is_salary_negotiable,
			description: parsed.description,
			requirements: parsed.requirements,
			certifications: parsed.certifications?.trim() || "",
			company_overview: parsed.company_overview?.trim() || undefined,
			role_overview: parsed.role_overview?.trim() || undefined,
			responsibilities: parsed.responsibilities?.trim() || undefined,
			nice_to_have: parsed.nice_to_have?.trim() || undefined,
			what_we_offer: parsed.what_we_offer?.trim() || undefined,
			job_benefits: parsed.job_benefits?.trim() || undefined,
			auto_score_matching_threshold: parsed.auto_score_matching_threshold,
			auto_email_invite_threshold: parsed.auto_email_invite_threshold,
			auto_shortlisted_threshold: parsed.auto_shortlisted_threshold,
			auto_denied_threshold: parsed.auto_denied_threshold,
			soft_skills: softSkillsList,
			technical_skills: technicalSkillsList,
			languages: normalizeLanguages(languagesList),
		});
	};

	const onSubmit: SubmitHandler<JobFormValues> = async () => {
		if (currentStep < TOTAL_STEPS) {
			await handleNext();
		} else {
			await handleFinalSave();
		}
	};

	const handleGenerate = async (target: "description" | "requirements") => {
		const missing = resolveMissingAiFields();
		if (missing.length > 0) {
			warningToast(`Fill ${missing.join(", ")} before generating content.`);
			return;
		}
		const payload = buildAiPayload(target);
		const generated = await generateJobContent(payload);
		if (!generated) return;
		if (target === "description") {
			setValue("description", generated.description, {
				shouldDirty: true,
				shouldValidate: true,
			});
		} else {
			setValue("requirements", generated.requirements, {
				shouldDirty: true,
				shouldValidate: true,
			});
		}
	};

	const missingAiFields = resolveMissingAiFields();

	const onPromptSubmit: SubmitHandler<AiPromptFormValues> = async (values) => {
		if (!Number.isFinite(jobId)) return;
		await upsertJobAiPrompt(jobId, values);
	};

	const isStale = !!job && job.id !== jobId;
	const isEffectivelyActive =
		job?.effective_is_active ?? job?.is_active ?? false;

	if ((loadingJob || !job || isStale || !formReady) && Number.isFinite(jobId)) {
		return (
			<section className="min-h-screen py-10 dark:bg-slate-950">
				<div className="mx-auto max-w-6xl animate-pulse px-4 sm:px-6 lg:px-8">
					{/* Header skeleton */}
					<div className="mb-8 rounded-xl bg-white px-8 py-6 dark:bg-slate-900">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700/50" />
								<div className="flex items-center gap-3">
									<div className="h-7 w-48 rounded bg-slate-200 dark:bg-slate-700/50" />
									<div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700/50" />
								</div>
							</div>
							<div className="flex gap-2">
								<div className="h-9 w-28 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
								<div className="h-9 w-28 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
							</div>
						</div>
						<div className="mt-4 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700/50" />
						<div className="mt-6 flex items-start">
							{Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="flex flex-1 items-start">
									{i > 0 && (
										<div className="mt-[18px] h-0.5 flex-1 bg-slate-200 dark:bg-slate-700/50" />
									)}
									<div className="flex flex-col items-center gap-1.5">
										<div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700/50" />
										<div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700/50" />
									</div>
									{i < 5 && (
										<div className="mt-[18px] h-0.5 flex-1 bg-slate-200 dark:bg-slate-700/50" />
									)}
								</div>
							))}
						</div>
					</div>

					{/* Tab switcher skeleton */}
					<div className="mb-8 flex w-fit gap-1 rounded-xl bg-white p-1 dark:bg-slate-900">
						<div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
						<div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
					</div>

					{/* Form card skeleton */}
					<div className="space-y-5 rounded-[10px] bg-white px-7 py-6 shadow-sm dark:bg-slate-900">
						<div className="space-y-1.5">
							<div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-700/50" />
							<div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-700/50" />
						</div>
						<div className="h-10 w-full rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
						<div className="grid grid-cols-2 gap-4">
							<div className="h-10 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
							<div className="h-10 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
							<div className="h-10 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
							<div className="h-10 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
						</div>
						<div className="h-10 w-full rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
						<div className="flex justify-end gap-3 pt-2">
							<div className="h-9 w-24 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
							<div className="h-9 w-24 rounded-[10px] bg-slate-200 dark:bg-slate-700/50" />
						</div>
					</div>
				</div>
			</section>
		);
	}

	if (!Number.isFinite(jobId)) {
		return (
			<div className="mx-auto mt-20 max-w-xl rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-900/20 dark:bg-red-950/20">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30">
					<XCircle className="h-8 w-8" />
				</div>
				<h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
					Invalid Job ID
				</h3>
				<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
					The job you are looking for could not be found or the ID is invalid.
				</p>
				<Link
					href="/jobs"
					className="mt-6 inline-flex items-center gap-2 font-bold text-[#005ca9] hover:underline"
				>
					<ChevronLeft className="h-4 w-4" />
					Back to Jobs
				</Link>
			</div>
		);
	}

	const progress = Math.round((currentStep / TOTAL_STEPS) * 100);

	return (
		<section className="min-h-screen py-10 dark:bg-slate-950">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* ── Header ── */}
				<div className="mb-8 rounded-xl bg-white px-8 py-6  dark:bg-slate-900">
					<div className="flex items-center justify-between">
						<div>
							<Link
								href="/jobs"
								className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-[#005ca9]"
							>
								<ChevronLeft className="h-4 w-4" />
								Back to Jobs
							</Link>
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
									Job Watch
								</h1>
								<span className="text-lg font-bold text-[#005ca9] dark:text-blue-400">
									{progress}%
								</span>
							</div>
						</div>
						<Button
							type="button"
							disabled={loadingToggleActive || loadingJob}
							onClick={() =>
								setJobActiveStatus(jobId, !(job?.is_active ?? false))
							}
							className={
								isEffectivelyActive
									? "rounded-[10px] bg-rose-600 text-white hover:bg-rose-500"
									: "rounded-[10px] bg-emerald-600 text-white hover:bg-emerald-500"
							}
						>
							{isEffectivelyActive ? "Inactivate Job" : "Activate Job"}
						</Button>
					</div>

					{/* Progress bar and Steps - Only show for details tab */}
					{activeTab === "details" && (
						<>
							<div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
								<div
									className="h-full rounded-full bg-[#005ca9] transition-all duration-500"
									style={{ width: `${progress}%` }}
								/>
							</div>

							<div className="mt-6 flex">
								{STEPS.map((step, i) => {
									const stepNum = i + 1;
									const done = stepNum < currentStep;
									const active = stepNum === currentStep;
									return (
										<div key={i} className="flex flex-1 items-start">
											{/* left connector */}
											{i > 0 && (
												<div
													className={`mt-[18px] h-0.5 flex-1 transition-colors ${done ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`}
												/>
											)}
											<div className="flex flex-col items-center">
												<div
													className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all
                                                    ${
																											done
																												? "bg-emerald-500 text-white"
																												: active
																													? "bg-[#005ca9] text-white shadow shadow-blue-200"
																													: "border-2 border-slate-200 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800"
																										}`}
												>
													{done ? (
														<Check className="h-4 w-4" strokeWidth={2.5} />
													) : (
														stepNum
													)}
												</div>
												<span
													className={`mt-1.5 text-[10px] font-medium text-center leading-tight
                                                    ${active ? "text-[#005ca9]" : done ? "text-emerald-600" : "text-slate-400"}`}
												>
													{step.label}
												</span>
											</div>
											{/* right connector (non-last) */}
											{i < STEPS.length - 1 && (
												<div
													className={`mt-[18px] h-0.5 flex-1 transition-colors ${done ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`}
												/>
											)}
										</div>
									);
								})}
							</div>
						</>
					)}
				</div>

				{/* Tab Switcher */}
				<div className="flex items-center gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl w-fit mb-8 border border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-800">
					<button
						type="button"
						onClick={() => setActiveTab("details")}
						className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "details" ? "bg-white text-[#005ca9] shadow-sm dark:bg-slate-800 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
					>
						Job Details
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("ai")}
						className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "ai" ? "bg-white text-[#005ca9] shadow-sm dark:bg-slate-800 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
					>
						AI Evaluation
					</button>
				</div>

				{/* ── Main Content Area ── */}
				{activeTab === "details" ? (
					/* ── Wizard content + navigation ── */
					<form onSubmit={handleSubmit(onSubmit, handleInvalid)}>
						<div className="rounded-[10px] bg-white px-7 py-6 dark:bg-slate-900 shadow-sm">
							{/* ─── STEP 1: Basic Info ─── */}
							{currentStep === 1 && (
								<div className="space-y-5">
									<div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
											Basic Information
										</h2>
										<p className="text-sm text-slate-500">
											Let&apos;s start with the essential details
										</p>
									</div>
									<Field
										label="Job Title"
										required
										error={errors.title?.message}
									>
										<Input
											placeholder="e.g. Senior Frontend Developer"
											className={inputCls}
											{...register("title")}
										/>
									</Field>
									<div className="grid grid-cols-2 gap-4">
										<Field
											label="Job Type"
											required
											error={errors.employment_type?.message}
										>
											<Controller
												name="employment_type"
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger className="w-full rounded-[10px] border-0 bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm">
															<SelectValue placeholder="Select type..." />
														</SelectTrigger>
														<SelectContent>
															{employmentTypeOptions.map((opt) => (
																<SelectItem key={opt.value} value={opt.value}>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</Field>
										<Field
											label="Industry"
											required
											error={errors.industry?.message}
										>
											<Controller
												name="industry"
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger className="w-full rounded-[10px] border-0 bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm">
															<SelectValue placeholder="e.g. Technology" />
														</SelectTrigger>
														<SelectContent>
															{jobIndustryOptions.map((opt) => (
																<SelectItem key={opt.value} value={opt.value}>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</Field>
										<Field
											label="Seniority Level"
											required
											error={errors.seniority_level?.message}
										>
											<Controller
												name="seniority_level"
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger className="w-full rounded-[10px] border-0 bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm">
															<SelectValue placeholder="Select level..." />
														</SelectTrigger>
														<SelectContent>
															{seniorityLevelOptions.map((opt) => (
																<SelectItem key={opt.value} value={opt.value}>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</Field>
										<Field
											label="Workplace Type"
											required
											error={errors.workplace_type?.message}
										>
											<Controller
												name="workplace_type"
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger className="w-full rounded-[10px] border-0 bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm">
															<SelectValue placeholder="Select type..." />
														</SelectTrigger>
														<SelectContent>
															{workplaceTypeOptions.map((opt) => (
																<SelectItem key={opt.value} value={opt.value}>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</Field>
										<Field
											label="Location"
											required
											error={errors.location?.message}
										>
											<Input
												placeholder="e.g. San Francisco, CA"
												className={inputCls}
												{...register("location")}
											/>
										</Field>
										<Field
											label="Auto Deactivate At"
											required
											error={errors.auto_deactivate_at?.message}
										>
											<Input
												type="datetime-local"
												className={inputCls}
												{...register("auto_deactivate_at")}
											/>
										</Field>
									</div>
								</div>
							)}

							{/* ─── STEP 2: Thresholds ─── */}
							{currentStep === 2 && (
								<div className="space-y-5">
									<div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
											AI Logic & Thresholds
										</h2>
										<p className="text-sm text-slate-500">
											Fine-tune the automation and matching logic
										</p>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<Field
											label="Matching Score Threshold (%)"
											error={errors.auto_score_matching_threshold?.message}
										>
											<Input
												type="number"
												placeholder="Min score to consider (e.g. 70)"
												className={inputCls}
												{...register("auto_score_matching_threshold")}
											/>
										</Field>
										<Field
											label="Email Invite Threshold (%)"
											error={errors.auto_email_invite_threshold?.message}
										>
											<Input
												type="number"
												placeholder="Score to auto-invite (e.g. 85)"
												className={inputCls}
												{...register("auto_email_invite_threshold")}
											/>
										</Field>
										<Field
											label="Shortlisted Threshold (%)"
											error={errors.auto_shortlisted_threshold?.message}
										>
											<Input
												type="number"
												placeholder="Score to auto-shortlist"
												className={inputCls}
												{...register("auto_shortlisted_threshold")}
											/>
										</Field>
										<Field
											label="Denied Threshold (%)"
											error={errors.auto_denied_threshold?.message}
										>
											<Input
												type="number"
												placeholder="Score to auto-deny"
												className={inputCls}
												{...register("auto_denied_threshold")}
											/>
										</Field>
									</div>
								</div>
							)}

							{/* ─── STEP 3: Compensation ─── */}
							{currentStep === 3 && (
								<div className="space-y-5">
									<div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
											Compensation Details
										</h2>
										<p className="text-sm text-slate-500">
											How much are you offering for this role?
										</p>
									</div>
									<div className="grid grid-cols-3 gap-4">
										<Field
											label="Currency"
											required
											error={errors.salary_currency?.message}
										>
											<Controller
												name="salary_currency"
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger className="w-full rounded-[10px] border-0 bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-700 text-sm">
															<SelectValue placeholder="USD, EUR..." />
														</SelectTrigger>
														<SelectContent>
															{jobSalaryCurrencyOptions.map((opt) => (
																<SelectItem key={opt.value} value={opt.value}>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
										</Field>
										<Field
											label="Min Salary"
											required
											error={errors.salary_from?.message}
										>
											<Input
												type="number"
												placeholder="e.g. 50000"
												className={inputCls}
												{...register("salary_from")}
											/>
										</Field>
										<Field
											label="Max Salary"
											required
											error={errors.salary_to?.message}
										>
											<Input
												type="number"
												placeholder="e.g. 80000"
												className={inputCls}
												{...register("salary_to")}
											/>
										</Field>
									</div>
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="is_salary_negotiable"
											className="h-4 w-4 rounded border-slate-300 text-[#005ca9] focus:ring-[#005ca9]"
											{...register("is_salary_negotiable")}
										/>
										<label
											htmlFor="is_salary_negotiable"
											className="text-sm text-slate-600 dark:text-slate-400"
										>
											Salary is negotiable
										</label>
									</div>
								</div>
							)}

							{/* ─── STEP 4: Description ─── */}
							{currentStep === 4 && (
								<div className="space-y-6">
									<div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
											Job Details
										</h2>
										<p className="text-sm text-slate-500">
											Provide a clear description and set of requirements
										</p>
									</div>
									<Field
										label="Job Description"
										required
										error={errors.description?.message}
									>
										<div className="space-y-3">
											<Controller
												name="description"
												control={control}
												render={({ field }) => (
													<RetraceTextEditor
														value={field.value ?? ""}
														onChange={field.onChange}
														placeholder="Describe the role and responsibilities..."
													/>
												)}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={
													loadingGenerateDescription ||
													missingAiFields.length > 0
												}
												onClick={() => handleGenerate("description")}
												className="h-9 gap-2 rounded-[10px] border-emerald-100 bg-emerald-50/50 px-4 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
											>
												<Sparkles className="h-3.5 w-3.5" />
												{loadingGenerateDescription
													? "Generating..."
													: "Generate Description"}
											</Button>
										</div>
									</Field>

									<Field
										label="Job Requirements"
										required
										error={errors.requirements?.message}
									>
										<div className="space-y-3">
											<Controller
												name="requirements"
												control={control}
												render={({ field }) => (
													<RetraceTextEditor
														value={field.value ?? ""}
														onChange={field.onChange}
														placeholder="List required skills and experience..."
													/>
												)}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={
													loadingGenerateRequirements ||
													missingAiFields.length > 0
												}
												onClick={() => handleGenerate("requirements")}
												className="h-9 gap-2 rounded-[10px] border-emerald-100 bg-emerald-50/50 px-4 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
											>
												<Sparkles className="h-3.5 w-3.5" />
												{loadingGenerateRequirements
													? "Generating..."
													: "Generate Requirements"}
											</Button>
										</div>
									</Field>

									<div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
										<Field
											label="Certifications"
											error={errors.certifications?.message}
										>
											<Textarea
												placeholder="List required certifications..."
												className={textareaCls}
												rows={3}
												{...register("certifications")}
											/>
										</Field>
										<div className="flex flex-col justify-center bg-slate-50/50 rounded-[10px] p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
											<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
												Pro Tip
											</p>
											<p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
												Use the magic button to generate formatted content based
												on your job title and criteria.
											</p>
										</div>
									</div>
								</div>
							)}

							{/* ─── STEP 5: Skills & Requirements ─── */}
							{currentStep === 5 && (
								<div className="space-y-6">
									<div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
											Skills & Extras
										</h2>
										<p className="text-sm text-slate-500">
											Add specific skills and optional deep-dive details
										</p>
									</div>
									<div className="grid grid-cols-2 gap-6">
										<SkillTagInput
											label="Soft Skills"
											icon={<Sparkles className="h-4 w-4 text-purple-500" />}
											values={softSkillsList}
											onChange={(next) =>
												setValue("soft_skills", next.join(", "), {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
											options={jobSoftSkillsOptions}
											placeholder="Type or select soft skills..."
											allowCustom
										/>
										<SkillTagInput
											label="Technical Skills"
											icon={<Code2 className="h-4 w-4 text-[#005ca9]" />}
											values={technicalSkillsList}
											onChange={(next) =>
												setValue("technical_skills", next.join(", "), {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
											options={jobTechnicalSkillsOptions}
											placeholder="Type or select technical skills..."
											allowCustom
										/>
										<SkillTagInput
											label="Interview Languages"
											icon={<Languages className="h-4 w-4 text-[#005ca9]" />}
											values={languagesList}
											onChange={(next) =>
												setValue("languages", next.join(", "), {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
											options={jobLanguageOptions}
											placeholder="Select Arabic or English"
											allowCustom={false}
										/>
									</div>
									<Field label="Certifications">
										<Textarea
											placeholder="e.g. PMP, AWS Certified Solutions Architect"
											className={textareaCls}
											rows={2}
											{...register("certifications")}
										/>
									</Field>

									<details className="rounded-[10px] bg-slate-50/50 group dark:bg-slate-800/50 overflow-hidden border border-slate-100 dark:border-slate-800 transition-all">
										<summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
											<span>Advanced Optional Content</span>
											<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
										</summary>
										<div className="space-y-5 border-t border-slate-100 px-6 py-6 dark:border-slate-800">
											<Field label="Company Overview">
												<Controller
													name="company_overview"
													control={control}
													render={({ field }) => (
														<RetraceTextEditor
															value={field.value ?? ""}
															onChange={field.onChange}
															placeholder="Share a brief company overview..."
														/>
													)}
												/>
											</Field>
											<Field label="Responsibilities">
												<Controller
													name="responsibilities"
													control={control}
													render={({ field }) => (
														<RetraceTextEditor
															value={field.value ?? ""}
															onChange={field.onChange}
															placeholder="List key responsibilities..."
														/>
													)}
												/>
											</Field>
											<Field label="What We Offer">
												<Controller
													name="what_we_offer"
													control={control}
													render={({ field }) => (
														<RetraceTextEditor
															value={field.value ?? ""}
															onChange={field.onChange}
															placeholder="Describe perks, culture, etc."
														/>
													)}
												/>
											</Field>
										</div>
									</details>
								</div>
							)}

							{/* ─── STEP 6: Summary ─── */}
							{currentStep === 6 && (
								<div className="space-y-6">
									<div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
											Review & Polish
										</h2>
										<p className="text-sm text-slate-500">
											One last look before you save everything
										</p>
									</div>

									<div className="grid gap-5 rounded-2xl border border-slate-100 bg-[#fafafa] p-6 dark:border-slate-800 dark:bg-slate-900/50">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#005ca9] dark:bg-blue-900/30">
													<Briefcase className="h-6 w-6" />
												</div>
												<div>
													<h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
														{watchedTitle || "Untitled Job"}
													</h3>
													<div className="flex flex-wrap gap-2 mt-1">
														<span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
															{watchedType || "Full-time"}
														</span>
														<span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
															{watchedLocation || "Remote"}
														</span>
														<span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
															{watchedSeniority || "Senior"}
														</span>
													</div>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => setCurrentStep(1)}
												className="h-8 text-xs font-bold text-[#005ca9] hover:bg-blue-50 uppercase tracking-wider"
											>
												Edit Basic Info
											</Button>
										</div>

										<div className="grid grid-cols-3 gap-8 py-6 border-y border-white dark:border-slate-800/50">
											<div>
												<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
													Match Threshold
												</p>
												<p className="mt-1 text-base font-bold text-slate-700 dark:text-slate-200">
													{getValues("auto_score_matching_threshold")}%
												</p>
											</div>
											<div>
												<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
													Auto-Invite
												</p>
												<p className="mt-1 text-base font-bold text-slate-700 dark:text-slate-200">
													{getValues("auto_email_invite_threshold")}%
												</p>
											</div>
											<div>
												<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
													Salary Range
												</p>
												<p className="mt-1 text-base font-bold text-slate-700 dark:text-slate-200">
													{getValues("salary_currency")}{" "}
													{Number(getValues("salary_from")).toLocaleString()} -{" "}
													{Number(getValues("salary_to")).toLocaleString()}
												</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
													Selected Skills
												</p>
												<div className="flex flex-wrap gap-1.5">
													{[...technicalSkillsList, ...softSkillsList]
														.slice(0, 10)
														.map((skill, i) => (
															<span
																key={i}
																className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
															>
																{skill}
															</span>
														))}
													{[...technicalSkillsList, ...softSkillsList].length >
														10 && (
														<span className="text-xs text-slate-400 content-center ml-1">
															+
															{[...technicalSkillsList, ...softSkillsList]
																.length - 10}{" "}
															more
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* ── Navigation Footer ── */}
						<div className="mt-8 flex items-center justify-between rounded-xl bg-white px-8 py-5 shadow-sm dark:bg-slate-900">
							<Button
								type="button"
								variant="ghost"
								onClick={handlePrev}
								disabled={currentStep === 1}
								className="h-11 gap-2 rounded-[10px] border-2 border-slate-200 px-6 font-bold text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
							>
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>

							<div className="flex items-center gap-4">
								{stepError && (
									<p className="text-xs font-bold text-rose-500 animate-pulse">
										{stepError}
									</p>
								)}
								{currentStep < TOTAL_STEPS ? (
									<Button
										type="button"
										onClick={handleNext}
										className="h-11 gap-2 rounded-[10px] bg-[#005ca9] px-8 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-[#005ca9]/90 hover:shadow-xl active:scale-95 dark:shadow-none"
									>
										Next Step
										<ArrowRight className="h-4 w-4" />
									</Button>
								) : (
									<Button
										type="button"
										onClick={handleFinalSave}
										disabled={
											loadingUpdateJob || isSubmitting || !isValid || !isDirty
										}
										className="h-11 gap-2 rounded-[10px] bg-emerald-600 px-8 font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-500 hover:shadow-xl active:scale-95 dark:shadow-none"
									>
										{loadingUpdateJob ? "Saving..." : "Save Job Details"}
										<CheckCircle2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</form>
				) : (
					/* ── AI Evaluation Tab ── */
					<div className="rounded-[10px] bg-white px-8 py-8 dark:bg-slate-900 shadow-sm">
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
										AI Evaluation Logic
									</h2>
									<p className="text-sm text-slate-500">
										Configure how the AI evaluates and scores candidates for
										this role
									</p>
								</div>
								<div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 dark:bg-blue-900/20">
									<div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
									<span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
										AI System Active
									</span>
								</div>
							</div>

							<div className="space-y-6">
								<Field
									label="Target Document Type"
									required
									error={promptErrors.target?.message}
								>
									<Input
										placeholder="e.g. resume"
										className={inputCls}
										{...registerPrompt("target")}
									/>
								</Field>

								<Field
									label="Main Evaluation Prompt"
									required
									error={promptErrors.prompt?.message}
								>
									<Textarea
										placeholder="Describe how the AI should evaluate candidates for this specific role..."
										className={`${textareaCls} min-h-[140px] leading-relaxed`}
										{...registerPrompt("prompt")}
									/>
								</Field>

								<div className="space-y-4">
									<div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
										<h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
											Structured Evaluation Criteria
										</h3>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => appendPrompt({ key: "", value: "" })}
											className="h-8 gap-1.5 rounded-lg border-blue-100 text-xs font-semibold text-[#005ca9] hover:bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20"
										>
											<Plus className="h-3.5 w-3.5" />
											Add Metric
										</Button>
									</div>

									<div className="grid gap-3">
										{promptFields.map((field, index) => (
											<div
												key={field.id}
												className="group relative rounded-xl border border-slate-100 bg-[#fafafa] p-4 transition-all hover:border-blue-100 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50"
											>
												<div className="grid gap-4 sm:grid-cols-2">
													<Field
														label="Metric Name"
														error={
															promptErrors.evaluation?.[index]?.key?.message
														}
													>
														<Input
															placeholder="e.g. Frontend Experience"
															className="border-0 bg-white shadow-none dark:bg-slate-800 text-sm h-10"
															{...registerPrompt(`evaluation.${index}.key`)}
														/>
													</Field>
													<Field
														label="Ideal Value / Description"
														error={
															promptErrors.evaluation?.[index]?.value?.message
														}
													>
														<Input
															placeholder="e.g. 5+ years with React"
															className="border-0 bg-white shadow-none dark:bg-slate-800 text-sm h-10"
															{...registerPrompt(`evaluation.${index}.value`)}
														/>
													</Field>
												</div>
												<button
													type="button"
													onClick={() => removePrompt(index)}
													className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-800"
												>
													<XCircle className="h-4 w-4" />
												</button>
											</div>
										))}
									</div>
									{promptErrors.evaluation &&
										typeof promptErrors.evaluation?.message === "string" && (
											<p className="text-xs text-red-500">
												{promptErrors.evaluation.message}
											</p>
										)}
								</div>

								<div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
									<Button
										type="button"
										onClick={handlePromptSubmit(onPromptSubmit)}
										disabled={
											loadingUpsertPrompt || !isPromptValid || !isPromptDirty
										}
										className="h-11 rounded-xl bg-[#005ca9] text-white hover:bg-[#005ca9]/90 px-8 font-bold shadow-lg shadow-blue-100"
									>
										{loadingUpsertPrompt ? "Saving..." : "Save AI Logic"}
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

export default JobWatchForm;
