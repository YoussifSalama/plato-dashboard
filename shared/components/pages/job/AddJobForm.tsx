"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Controller,
	useForm,
	useWatch,
	type Resolver,
	type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Sparkles,
	ChevronLeft,
	ChevronRight,
	Check,
	Plus,
	X,
	CheckCircle,
	Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
	seniorityLevelOptions,
	workplaceTypeOptions,
} from "@/shared/core/job/options";
import { splitList } from "@/shared/components/pages/job/jobFormUtils";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import { warningToast } from "@/shared/helper/toast";
import JobAiPromptModal, {
	AiPromptFormValues,
} from "@/shared/components/pages/job/JobAiPromptModal";
import JobSuccessScreen from "@/shared/components/pages/job/JobSuccessScreen";
import RetraceTextEditor from "@/shared/components/common/RetraceTextEditor";
import SkillTagInput from "@/shared/components/pages/job/SkillTagInput";

/* ─────────────────── Schema ─────────────────── */
const numberOrUndefined = (value: unknown) => {
	if (value === "" || value == null) return undefined;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? undefined : parsed;
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
		required_documents: z.union([z.literal(""), z.string()]).optional(),
	})
	.refine((data) => data.salary_from <= data.salary_to, {
		message: "Salary minimum must be ≤ salary maximum.",
		path: ["salary_from"],
	});

type JobFormValues = z.input<typeof jobSchema>;

/* ─────────────────── Steps ─────────────────── */
const STEPS = [
	{ label: "Basic Info", subtitle: "Job title and type" },
	{ label: "Thresholds", subtitle: "AI thresholds" },
	{ label: "Compensation", subtitle: "Salary details" },
	{ label: "Description", subtitle: "Job details" },
	{ label: "Skills", subtitle: "Required skills" },
	{ label: "Additional", subtitle: "Optional info" },
] as const;

const TOTAL_STEPS = 6; // keep in sync with STEPS array

const STEP_REQUIRED: Record<number, (keyof JobFormValues)[]> = {
	1: [
		"title",
		"employment_type",
		"industry",
		"seniority_level",
		"location",
		"auto_deactivate_at",
	],
	2: [], // thresholds — all optional
	3: ["salary_currency", "salary_from", "salary_to"],
	4: ["description", "requirements"],
	5: [], // validated manually (need ≥1 skill)
	6: [],
};

/* ─────────────────── Field helper — OUTSIDE to avoid focus loss ─────────────────── */
interface FieldProps {
	label: string;
	required?: boolean;
	error?: string;
	children: React.ReactNode;
	className?: string;
}
const Field = ({ label, required, error, children, className }: FieldProps) => (
	<div className={`space-y-1.5 ${className ?? ""}`}>
		<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
			{label}
			{required && <span className="ml-0.5 text-red-500"> *</span>}
		</label>
		{children}
		{error && <p className="text-xs text-red-500">{error}</p>}
	</div>
);

/* ─────────────────── Shared styles ─────────────────── */
const inputCls =
	"h-10! min-h-0 border-0 rounded-[10px] bg-[#fafafa] dark:bg-slate-800 text-sm shadow-none ring-0 focus-visible:ring-1 focus-visible:ring-[#005ca9]/30";
const textareaCls = `${inputCls} resize-none`;

/* ─────────────────── Salary helpers ─────────────────── */
const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: "$",
	EUR: "€",
	GBP: "£",
	EGP: "E£",
};
const fmt = (n: number, sym: string) => {
	if (n >= 1000) return `${sym}${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
	return `${sym}${n.toLocaleString()}`;
};
const fmtFull = (n: number, code: string) => `${code} ${n.toLocaleString()}`;

const normalizeLanguageValue = (value: string): string | null => {
	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (normalized === "ar" || normalized === "arabic") return "ar";
	if (normalized === "en" || normalized === "english") return "en";
	if (normalized === "es" || normalized === "spanish" || normalized === "español") return "es";
	if (normalized === "fr" || normalized === "french" || normalized === "français") return "fr";
	if (normalized === "de" || normalized === "german" || normalized === "deutsch") return "de";
	if (normalized === "zh" || normalized === "chinese" || normalized === "中文") return "zh";
	if (normalized === "hi" || normalized === "hindi" || normalized === "हिन्दी") return "hi";
	if (normalized === "it" || normalized === "italian" || normalized === "italiano") return "it";
	return null;
};

const normalizeLanguages = (values: string[]): string[] => {
	const output: string[] = [];
	values.forEach((value) => {
		const mapped = normalizeLanguageValue(value);
		if (mapped && !output.includes(mapped)) {
			output.push(mapped);
		}
	});
	return output;
};

/* ─────────────────── Main component ─────────────────── */
const AddJobForm = () => {
	const DRAFT_KEY = "plato_job_draft_v1";
	const [currentStep, setCurrentStep] = useState(1);
	const [stepError, setStepError] = useState<string | null>(null);
	const [promptOpen, setPromptOpen] = useState(false);
	const [skillInput, setSkillInput] = useState("");
	const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
	const [softSkillsTags, setSoftSkillsTags] = useState<string[]>([]);
	const [certificationsTags, setCertificationsTags] = useState<string[]>([]);
	const [requiredDocsTags, setRequiredDocsTags] = useState<string[]>([]);
	const skillInputRef = useRef<HTMLInputElement>(null);
	const [successData, setSuccessData] = useState<{
		jobId?: string;
		jobTitle: string;
		jobType: string;
		location: string;
		salaryFrom?: number;
		salaryTo?: number;
		salaryCurrency?: string;
	} | null>(null);

	const {
		createJob,
		createJobAiPrompt,
		generateJobContent,
		loadingCreateJob,
		loadingCreatePrompt,
		loadingGenerateDescription,
		loadingGenerateRequirements,
	} = useJobStore();

	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		reset,
		trigger,
		formState: { errors, isSubmitting },
	} = useForm<JobFormValues>({
		defaultValues: async () => {
			const empty: JobFormValues = {
				title: "",
				employment_type: "",
				workplace_type: "",
				seniority_level: "",
				industry: "",
				location: "",
				auto_deactivate_at: "",
				salary_currency: "",
				salary_from: undefined,
				salary_to: undefined,
				is_salary_negotiable: false,
				description: "",
				requirements: "",
				certifications: "",
				what_we_offer: "",
				job_benefits: "",
				auto_score_matching_threshold: undefined,
				auto_email_invite_threshold: undefined,
				auto_shortlisted_threshold: undefined,
				auto_denied_threshold: undefined,
				soft_skills: "",
				technical_skills: "",
				languages: "",
				required_documents: "",
			};
			if (typeof window === "undefined") return empty;
			const saved = window.localStorage.getItem(DRAFT_KEY);
			if (!saved) return empty;
			try {
				const draft = JSON.parse(saved) as Partial<JobFormValues> & {
					technicalSkillsArr?: string[];
					softSkillsArr?: string[];
					certificationsArr?: string[];
					requiredDocsArr?: string[];
				};
				if (draft.technicalSkillsArr?.length)
					setTechnicalSkills(draft.technicalSkillsArr);
				if (draft.softSkillsArr?.length) setSoftSkillsTags(draft.softSkillsArr);
				if (draft.certificationsArr?.length)
					setCertificationsTags(draft.certificationsArr);
				if (draft.requiredDocsArr?.length)
					setRequiredDocsTags(draft.requiredDocsArr);
				return { ...empty, ...draft };
			} catch {
				window.localStorage.removeItem(DRAFT_KEY);
				return empty;
			}
		},
		mode: "onChange",
		resolver: zodResolver(jobSchema) as Resolver<JobFormValues>,
	});

	// Watch salary fields for live range display
	const watchedCurrency = useWatch({ control, name: "salary_currency" });
	const watchedFrom = useWatch({ control, name: "salary_from" });
	const watchedTo = useWatch({ control, name: "salary_to" });

	const salaryRangeDisplay = useMemo(() => {
		const from = Number(watchedFrom);
		const to = Number(watchedTo);
		const code = watchedCurrency || "USD";
		if (!from && !to) return null;
		const sym = CURRENCY_SYMBOLS[code] ?? code;
		const rangeStr = `${code} ${from ? from.toLocaleString() : "0"} - ${to ? to.toLocaleString() : "0"}`;
		const avg = from && to ? Math.round((from + to) / 2) : from || to;
		const avgStr = avg ? `Average: ${code} ${avg.toLocaleString()}` : null;
		return { rangeStr, avgStr };
	}, [watchedFrom, watchedTo, watchedCurrency]);

	// Watch basic info for summary panel in step 5
	const watchedTitle = useWatch({ control, name: "title" });
	const watchedType = useWatch({ control, name: "employment_type" });
	const watchedLocation = useWatch({ control, name: "location" });
	const watchedSeniority = useWatch({ control, name: "seniority_level" });
	const watchedLanguages = useWatch({ control, name: "languages" });
	const languagesList = useMemo(
		() => normalizeLanguages(splitList(watchedLanguages)),
		[watchedLanguages]
	);

	const saveDraft = useCallback(() => {
		if (typeof window === "undefined") return;
		const values = getValues();
		window.localStorage.setItem(
			DRAFT_KEY,
			JSON.stringify({
				...values,
				technicalSkillsArr: technicalSkills,
				softSkillsArr: softSkillsTags,
				certificationsArr: certificationsTags,
				requiredDocsArr: requiredDocsTags,
			})
		);
	}, [
		getValues,
		technicalSkills,
		softSkillsTags,
		certificationsTags,
		requiredDocsTags,
	]);

	const watchedForm = useWatch({ control });
	useEffect(() => {
		saveDraft();
	}, [
		watchedForm,
		technicalSkills,
		softSkillsTags,
		certificationsTags,
		requiredDocsTags,
		saveDraft,
	]);

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

	// Skills handling
	const addSkill = () => {
		const val = skillInput.trim();
		if (!val) return;
		if (!technicalSkills.includes(val)) {
			const next = [...technicalSkills, val];
			setTechnicalSkills(next);
			setValue("technical_skills", next.join(", "), { shouldDirty: true });
		}
		setSkillInput("");
		skillInputRef.current?.focus();
	};
	const removeSkill = (skill: string) => {
		const next = technicalSkills.filter((s) => s !== skill);
		setTechnicalSkills(next);
		setValue("technical_skills", next.join(", "), { shouldDirty: true });
	};

	// AI
	const resolveMissingAiFields = () => {
		const v = getValues();
		const m: string[] = [];
		if (!v.title?.trim()) m.push("job title");
		if (!v.employment_type) m.push("employment type");
		if (!v.industry) m.push("industry");
		if (!v.seniority_level) m.push("seniority level");
		if (!v.location) m.push("location");
		return m;
	};

	const handleGenerate = async (target: "description" | "requirements") => {
		const missing = resolveMissingAiFields();
		if (missing.length > 0) {
			warningToast(`Fill ${missing.join(", ")} first.`);
			return;
		}
		const v = getValues();
		const generated = await generateJobContent({
			title: v.title?.trim() ?? "",
			seniority_level: v.seniority_level ?? "",
			industry: v.industry ?? "",
			employment_type: v.employment_type ?? "",
			workplace_type: v.workplace_type ?? "",
			location: v.location ?? "",
			technical_skills: technicalSkills,
			soft_skills: splitList(v.soft_skills),
			target,
		});
		if (!generated) return;
		if (target === "description")
			setValue("description", generated.description, {
				shouldDirty: true,
				shouldValidate: true,
			});
		else
			setValue("requirements", generated.requirements, {
				shouldDirty: true,
				shouldValidate: true,
			});
	};

	const handleNext = async () => {
		const fields = STEP_REQUIRED[currentStep];
		if (fields.length > 0) {
			const valid = await trigger(fields);
			if (!valid) {
				setStepError("Please complete all required fields");
				return;
			}
		}
		// Step 5: need at least one skill
		if (currentStep === 5 && technicalSkills.length === 0) {
			setStepError("Please add at least one skill to continue");
			return;
		}
		setStepError(null);
		setCurrentStep((s) => s + 1);
	};

	const handlePublishClick = (e: React.MouseEvent) => {
		e.preventDefault();
		handleSubmit(onSubmit)();
	};

	const handlePrev = () => {
		setStepError(null);
		setCurrentStep((s) => Math.max(s - 1, 1));
	};

	const onSubmit: SubmitHandler<JobFormValues> = async (values) => {
		// Safety guard — never submit unless we're actually on the last step
		if (currentStep !== TOTAL_STEPS) return;
		const parsed = jobSchema.parse(values);
		const created = await createJob({
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
			certifications: parsed.certifications?.trim() || undefined,
			what_we_offer: parsed.what_we_offer?.trim() || undefined,
			job_benefits: parsed.job_benefits?.trim() || undefined,
			auto_score_matching_threshold: parsed.auto_score_matching_threshold,
			auto_email_invite_threshold: parsed.auto_email_invite_threshold,
			auto_shortlisted_threshold: parsed.auto_shortlisted_threshold,
			auto_denied_threshold: parsed.auto_denied_threshold,
			soft_skills: splitList(parsed.soft_skills),
			technical_skills: technicalSkills,
			languages: normalizeLanguages(splitList(parsed.languages)),
			required_documents: parsed.required_documents?.trim() || undefined,
		});
		if (created) {
			const anyCreated = created as unknown as { id?: number | string };
			setSuccessData({
				jobId: anyCreated.id != null ? String(anyCreated.id) : undefined,
				jobTitle: parsed.title,
				jobType: parsed.employment_type,
				location: parsed.location,
				salaryFrom: parsed.salary_from,
				salaryTo: parsed.salary_to,
				salaryCurrency: parsed.salary_currency,
			});
			reset();
			setTechnicalSkills([]);
			setSkillInput("");
			setSoftSkillsTags([]);
			setCertificationsTags([]);
			setRequiredDocsTags([]);
			if (typeof window !== "undefined")
				window.localStorage.removeItem(DRAFT_KEY);
		}
	};

	const handlePromptModalSubmit = async (values: AiPromptFormValues) => {
		const ok = await createJobAiPrompt(values);
		if (ok) setPromptOpen(false);
	};

	const resetWizard = () => {
		setSuccessData(null);
		setCurrentStep(1);
		setStepError(null);
	};
	const progress = Math.round((currentStep / STEPS.length) * 100);

	// Inline select renderer — NOT a component, just a JSX expression to avoid re-mount
	const renderSelect = (
		name: keyof JobFormValues,
		placeholder: string,
		options: { value: string; label: string }[],
		label?: string,
		required?: boolean
	) => {
		const node = (
			<Controller
				control={control}
				name={name}
				render={({ field }) => (
					<Select onValueChange={field.onChange} value={field.value as string}>
						<SelectTrigger className="h-10! min-h-0 w-full rounded-[10px] border-0 bg-[#fafafa] shadow-none ring-0 focus:ring-1 focus:ring-[#005ca9]/30 dark:bg-slate-800 text-sm">
							<SelectValue placeholder={placeholder} />
						</SelectTrigger>
						<SelectContent>
							{options.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			/>
		);
		if (!label) return node;
		return (
			<Field
				label={label}
				required={required}
				error={errors[name]?.message as string | undefined}
			>
				{node}
			</Field>
		);
	};

	/* ── Success screen ── */
	if (successData) {
		return (
			<>
				<JobSuccessScreen {...successData} onPostAnother={resetWizard} />
				<JobAiPromptModal
					open={promptOpen}
					onOpenChange={setPromptOpen}
					onSubmit={handlePromptModalSubmit}
					loading={loadingCreatePrompt}
				/>
			</>
		);
	}

	/* ── Wizard ── */
	return (
		<section className="mx-auto max-w-3xl space-y-4 px-2 dark:bg-slate-900">
			{/* Page title */}
			<div>
				<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
					Add New Job
				</h1>
				<p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
					Create a new job posting in {STEPS.length} easy steps
				</p>
			</div>

			{/* ── Step indicator card ── */}
			<div className="rounded-[10px] bg-white px-6 py-5 dark:bg-slate-900">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
							Step {currentStep} of {STEPS.length}
						</p>
						<p className="text-xs text-slate-400">
							{STEPS[currentStep - 1].subtitle}
						</p>
					</div>
					<span className="text-lg font-bold text-[#005ca9] dark:text-blue-400">
						{progress}%
					</span>
				</div>

				{/* Progress bar */}
				<div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
					<div
						className="h-full rounded-full bg-[#005ca9] transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Step circles */}
				<div className="mt-5 flex">
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
			</div>

			{/* ── Step content + navigation ── */}
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="rounded-[10px] bg-white px-7 py-6 dark:bg-slate-900">
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
							<Field label="Job Title" required error={errors.title?.message}>
								<Input
									placeholder="e.g. Senior Frontend Developer"
									className={inputCls}
									{...register("title")}
								/>
							</Field>
							<div className="grid grid-cols-2 gap-4">
								{renderSelect(
									"employment_type",
									"Select type...",
									selectOptions.employment,
									"Job Type",
									true
								)}
								{renderSelect(
									"industry",
									"e.g. Technology",
									selectOptions.industry,
									"Industry",
									true
								)}
								{renderSelect(
									"seniority_level",
									"Select level...",
									selectOptions.seniority,
									"Seniority Level",
									true
								)}
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
									className="col-span-2"
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
									Thresholds
								</h2>
								<p className="text-sm text-slate-500">
									Set score thresholds to automate candidate processing
									(optional)
								</p>
							</div>
							<div className="grid grid-cols-2 gap-5">
								<div className="space-y-1.5">
									<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
										Auto Score Matching Threshold
									</label>
									<Input
										type="number"
										min={0}
										max={100}
										placeholder="e.g. 75"
										className={inputCls}
										{...register("auto_score_matching_threshold")}
									/>
									<p className="text-xs text-slate-400">
										Minimum score to qualify a candidate
									</p>
								</div>
								<div className="space-y-1.5">
									<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
										Auto Email Invite Threshold
									</label>
									<Input
										type="number"
										min={0}
										max={100}
										placeholder="e.g. 80"
										className={inputCls}
										{...register("auto_email_invite_threshold")}
									/>
									<p className="text-xs text-slate-400">
										Score required to auto-send interview invite
									</p>
								</div>
								<div className="space-y-1.5">
									<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
										Auto Shortlisted Threshold
									</label>
									<Input
										type="number"
										min={0}
										max={100}
										placeholder="e.g. 85"
										className={inputCls}
										{...register("auto_shortlisted_threshold")}
									/>
									<p className="text-xs text-slate-400">
										Score required to auto-shortlist a candidate
									</p>
								</div>
								<div className="space-y-1.5">
									<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
										Auto Denied Threshold
									</label>
									<Input
										type="number"
										min={0}
										max={100}
										placeholder="e.g. 50"
										className={inputCls}
										{...register("auto_denied_threshold")}
									/>
									<p className="text-xs text-slate-400">
										Score below which a candidate is auto-denied
									</p>
								</div>
							</div>
							<div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800">
								💡 Leave fields empty to disable automation for that action.
								Scores are out of 100.
							</div>
						</div>
					)}

					{/* ─── STEP 3: Compensation ─── */}
					{currentStep === 3 && (
						<div className="space-y-5">
							<div>
								<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
									Compensation
								</h2>
								<p className="text-sm text-slate-500">
									Define the salary range for this position
								</p>
							</div>
							{renderSelect(
								"salary_currency",
								"Select currency...",
								selectOptions.currency,
								"Currency",
								true
							)}
							<div className="grid grid-cols-2 gap-4">
								<Field
									label="Minimum Salary"
									required
									error={errors.salary_from?.message}
								>
									<Input
										type="number"
										min={0}
										placeholder="e.g. 8,000"
										className={inputCls}
										{...register("salary_from")}
									/>
								</Field>
								<Field
									label="Maximum Salary"
									required
									error={errors.salary_to?.message}
								>
									<Input
										type="number"
										min={0}
										placeholder="e.g. 12,000"
										className={inputCls}
										{...register("salary_to")}
									/>
								</Field>
							</div>
							{/* Live salary range display */}
							{salaryRangeDisplay && (
								<div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
									<div className="flex items-center justify-between">
										<span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
											Salary Range
										</span>
										<span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
											{salaryRangeDisplay.rangeStr}
										</span>
									</div>
									{salaryRangeDisplay.avgStr && (
										<p className="mt-0.5 text-xs text-slate-400">
											{salaryRangeDisplay.avgStr}
										</p>
									)}
								</div>
							)}
							{renderSelect(
								"workplace_type",
								"Select workplace type...",
								selectOptions.workplace,
								"Workplace Type",
								true
							)}
						</div>
					)}

					{/* ─── STEP 4: Description ─── */}
					{currentStep === 4 && (
						<div className="space-y-6">
							<div>
								<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
									Job Description
								</h2>
								<p className="text-sm text-slate-500">
									Describe the role and requirements
								</p>
							</div>
							{/* Job Description */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<label className="text-sm font-medium text-slate-700 dark:text-slate-300">
										Job Description <span className="text-red-500">*</span>
									</label>
									<button
										type="button"
										disabled={
											loadingGenerateDescription ||
											resolveMissingAiFields().length > 0
										}
										onClick={() => handleGenerate("description")}
										className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-900/30 dark:text-violet-400"
									>
										<Sparkles className="h-3 w-3" />
										{loadingGenerateDescription
											? "Generating…"
											: "Generate with AI"}
									</button>
								</div>
								<Controller
									control={control}
									name="description"
									render={({ field }) => (
										<RetraceTextEditor
											value={field.value}
											onChange={field.onChange}
											placeholder="Describe the role and responsibilities..."
											minHeight={200}
										/>
									)}
								/>
								{errors.description && (
									<p className="text-xs text-red-500">
										{errors.description.message}
									</p>
								)}
							</div>
							{/* Requirements */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<label className="text-sm font-medium text-slate-700 dark:text-slate-300">
										Requirements <span className="text-red-500">*</span>
									</label>
									<button
										type="button"
										disabled={
											loadingGenerateRequirements ||
											resolveMissingAiFields().length > 0
										}
										onClick={() => handleGenerate("requirements")}
										className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-900/30 dark:text-violet-400"
									>
										<Sparkles className="h-3 w-3" />
										{loadingGenerateRequirements
											? "Generating…"
											: "Generate with AI"}
									</button>
								</div>
								<Controller
									control={control}
									name="requirements"
									render={({ field }) => (
										<RetraceTextEditor
											value={field.value}
											onChange={field.onChange}
											placeholder="List the required qualifications and experience..."
											minHeight={200}
										/>
									)}
								/>
								{errors.requirements && (
									<p className="text-xs text-red-500">
										{errors.requirements.message}
									</p>
								)}
							</div>
						</div>
					)}

					{/* ─── STEP 5: Technical Skills ─── */}
					{currentStep === 5 && (
						<div className="space-y-5">
							<div>
								<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
									Technical Skills
								</h2>
								<p className="text-sm text-slate-500">
									Add required technical skills for this role
								</p>
							</div>
							<div className="space-y-1.5">
								<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
									Add Skills <span className="text-red-500">*</span>
								</label>
								<div className="flex gap-2">
									<Input
										ref={skillInputRef}
										value={skillInput}
										onChange={(e) => setSkillInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addSkill();
											}
										}}
										placeholder="e.g., React, TypeScript, Node.js"
										className={inputCls}
									/>
									<Button
										type="button"
										onClick={addSkill}
										className="shrink-0 bg-[#005ca9] text-white hover:bg-[#005ca9]/90"
									>
										Add
									</Button>
								</div>
							</div>
							{technicalSkills.length === 0 ? (
								<p className="py-4 text-center text-sm text-slate-400">
									No skills added yet. Add at least one skill to continue.
								</p>
							) : (
								<div className="space-y-2">
									<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
										Added Skills ({technicalSkills.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{technicalSkills.map((skill) => (
											<span
												key={skill}
												className="inline-flex items-center gap-1.5 rounded-full bg-[#005ca9] px-3 py-1 text-sm font-medium text-white"
											>
												{skill}
												<button
													type="button"
													onClick={() => removeSkill(skill)}
													className="ml-0.5 rounded-full hover:bg-white/20"
												>
													<X className="h-3 w-3" />
												</button>
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* ─── STEP 6: Additional Information ─── */}
					{currentStep === 6 && (
						<div className="space-y-5">
							<div>
								<h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
									Additional Information
								</h2>
								<p className="text-sm text-slate-500">
									Optional details to enhance your job posting
								</p>
							</div>
							<Field label="What We Offer">
								<Textarea
									rows={3}
									placeholder="What can candidates expect from this role?"
									className={textareaCls}
									{...register("what_we_offer")}
								/>
							</Field>
							<Field label="Job Benefits">
								<Textarea
									rows={3}
									placeholder="List benefits and perks..."
									className={textareaCls}
									{...register("job_benefits")}
								/>
							</Field>
							<SkillTagInput
								label="Soft Skills"
								values={softSkillsTags}
								onChange={(next) => {
									setSoftSkillsTags(next);
									setValue("soft_skills", next.join(", "), {
										shouldDirty: true,
									});
								}}
								options={[]}
								placeholder="e.g. Communication, Leadership"
								allowCustom={true}
								hint="Press comma, Enter, or Tab to add a skill."
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
								placeholder="Select interview language(s)"
								allowCustom={false}
							/>
							<SkillTagInput
								label="Required Certifications"
								values={certificationsTags}
								onChange={(next) => {
									setCertificationsTags(next);
									setValue("certifications", next.join(", "), {
										shouldDirty: true,
									});
								}}
								options={[]}
								placeholder="e.g. PMP, Scrum Master"
								allowCustom={true}
								hint="Press comma, Enter, or Tab to add a certification."
							/>
							<SkillTagInput
								label="Required Documents"
								values={requiredDocsTags}
								onChange={(next) => {
									setRequiredDocsTags(next);
									setValue("required_documents", next.join(", "), {
										shouldDirty: true,
									});
								}}
								options={[]}
								placeholder="e.g. National ID, Work Permit"
								allowCustom={true}
								hint="Specify documents candidates MUST upload. Press comma, Enter, or Tab to add."
							/>

							{/* Job Summary */}
							<div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
								<p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
									Job Summary
								</p>
								<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
									<div className="flex gap-2">
										<span className="text-slate-400">Position</span>
										<span className="font-medium text-slate-700 dark:text-slate-200 truncate">
											{watchedTitle || "—"}
										</span>
									</div>
									<div className="flex gap-2">
										<span className="text-slate-400">Type</span>
										<span className="font-medium text-slate-700 dark:text-slate-200">
											{watchedType || "—"}
										</span>
									</div>
									<div className="flex gap-2">
										<span className="text-slate-400">Location</span>
										<span className="font-medium text-slate-700 dark:text-slate-200 truncate">
											{watchedLocation || "—"}
										</span>
									</div>
									<div className="flex gap-2">
										<span className="text-slate-400">Salary</span>
										<span className="font-medium text-slate-700 dark:text-slate-200">
											{salaryRangeDisplay ? salaryRangeDisplay.rangeStr : "—"}
										</span>
									</div>
									<div className="flex gap-2">
										<span className="text-slate-400">Skills</span>
										<span className="font-medium text-slate-700 dark:text-slate-200">
											{technicalSkills.length > 0
												? `${technicalSkills.length} added`
												: "—"}
										</span>
									</div>
									<div className="flex flex-col gap-1 col-span-2 mt-4">
										<span className="text-slate-400">Description</span>
										<div
											className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3"
											dangerouslySetInnerHTML={{
												__html: getValues("description") || "—",
											}}
										/>
									</div>
									<div className="flex flex-col gap-1 col-span-2">
										<span className="text-slate-400">Requirements</span>
										<div
											className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3"
											dangerouslySetInnerHTML={{
												__html: getValues("requirements") || "—",
											}}
										/>
									</div>
									<div className="flex gap-2">
										<span className="text-slate-400">Seniority</span>
										<span className="font-medium text-slate-700 dark:text-slate-200">
											{watchedSeniority || "—"}
										</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* ── Navigation footer ── */}
				<div className="mt-4 flex items-center justify-between rounded-xl bg-white px-6 py-4 dark:bg-slate-900">
					<Button
						type="button"
						variant="ghost"
						onClick={handlePrev}
						disabled={currentStep === 1}
						className="gap-3 rounded-[10px] border border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-30"
					>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Button>

					{stepError ? (
						<p className="text-sm font-medium text-red-500">{stepError}</p>
					) : (
						<span />
					)}

					{currentStep < TOTAL_STEPS ? (
						<Button
							key="btn-next"
							type="button"
							onClick={handleNext}
							className="gap-3 rounded-[10px] bg-[#005ca9] text-white hover:bg-[#005ca9]/90"
						>
							Next <ChevronRight className="h-4 w-4" />
						</Button>
					) : (
						<Button
							key="btn-publish"
							type="button"
							onClick={handlePublishClick}
							disabled={loadingCreateJob || isSubmitting}
							className="gap-1.5 rounded-[10px] bg-emerald-500 text-white hover:bg-emerald-600"
						>
							<CheckCircle className="h-4 w-4" />
							{loadingCreateJob || isSubmitting ? "Publishing…" : "Publish Job"}
						</Button>
					)}
				</div>
			</form>

			<JobAiPromptModal
				open={promptOpen}
				onOpenChange={setPromptOpen}
				onSubmit={handlePromptModalSubmit}
				loading={loadingCreatePrompt}
			/>
		</section>
	);
};

export default AddJobForm;
