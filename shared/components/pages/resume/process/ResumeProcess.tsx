"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
	Eye,
	Sparkles,
	Trash2,
	Upload,
	Briefcase,
	FileText,
} from "lucide-react";
import { useResumeStore } from "@/shared/store/pages/resume/useResumeStore";
import { successToast, warningToast } from "@/shared/helper/toast";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import { Tooltip } from "@/components/ui/tooltip";

const AI_PROMPT_TAGS = [
	{ label: "[shortlist]", value: "[shortlist] " },
	{ label: "[send invitation]", value: "[send invitation] " },
	{ label: "[deny]", value: "[deny] " },
] as const;

const SelectedFilesList = ({
	files,
	filter,
	isExpanded,
	listId,
	maxFileSizeBytes,
	onClear,
	onFilterChange,
	onRemove,
	onToggle,
}: {
	files: File[];
	filter: "all" | "docs" | "pdf";
	isExpanded: boolean;
	listId: string;
	maxFileSizeBytes: number;
	onClear: () => void;
	onFilterChange: (filter: "all" | "docs" | "pdf") => void;
	onRemove: (file: File) => void;
	onToggle: () => void;
}) => {
	const [visibleCount, setVisibleCount] = useState(50);

	const isPdf = (name: string) => name.toLowerCase().endsWith(".pdf");
	const isDoc = (name: string) =>
		name.toLowerCase().endsWith(".doc") || name.toLowerCase().endsWith(".docx");
	const filteredFiles = files.filter((file) => {
		if (filter === "pdf") return isPdf(file.name);
		if (filter === "docs") return isDoc(file.name);
		return true;
	});

	const displayedFiles = filteredFiles.slice(0, visibleCount);

	const getFileTone = (file: File) => {
		if (file.size > maxFileSizeBytes) {
			return "border-red-300 bg-red-50 text-red-900 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-100";
		}
		if (file.size === maxFileSizeBytes) {
			return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100";
		}
		return "border-blue-200/80 dark:border-slate-700/60";
	};

	return (
		<div
			className={clsx(
				"w-full rounded-md border border-blue-200 bg-white p-3 shadow-sm",
				"dark:border-slate-700/60 dark:bg-slate-900"
			)}
		>
			<div
				className={clsx(
					"flex items-center justify-between mb-2 cursor-pointer select-none"
				)}
				role="button"
				tabIndex={0}
				aria-expanded={isExpanded}
				aria-controls={listId}
				onClick={onToggle}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						onToggle();
					}
				}}
			>
				<div
					className={clsx(
						"text-xs sm:text-sm text-blue-600 dark:text-slate-300"
					)}
				>
					Selected files ({files.length}/500)
				</div>
				<div
					className={clsx(
						"flex items-center gap-2 text-[10px] sm:text-[11px] md:text-xs"
					)}
				>
					{(["all", "docs", "pdf"] as const).map((item) => (
						<button
							key={item}
							type="button"
							onClick={(event) => {
								event.stopPropagation();
								onFilterChange(item);
							}}
							className={clsx(
								"rounded-[10px] border border-blue-200 px-2 py-1 transition-all duration-300",
								item === filter
									? "bg-[#005CA9] text-white"
									: "bg-blue-50 text-blue-600 hover:bg-blue-100/80 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
							)}
						>
							{item.toUpperCase()}
						</button>
					))}
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onClear();
						}}
						className={clsx(
							"rounded-[10px] border border-red-200 px-2 py-1 transition-all duration-300",
							"bg-red-50 text-red-600 hover:bg-red-100/80 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/60"
						)}
					>
						Clear all
					</button>
				</div>
			</div>
			{isExpanded && (
				<ul id={listId} className={clsx("space-y-2")}>
					{displayedFiles.map((file, index) => (
						<li
							key={`${file.name}-${index}`}
							className={clsx(
								"flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
								getFileTone(file)
							)}
						>
							<span className={clsx("min-w-0 text-xs sm:text-sm truncate")}>
								{file.name}
							</span>
							<div className={clsx("flex items-center gap-2")}>
								<button
									type="button"
									onClick={() => {
										const url = URL.createObjectURL(file);
										window.open(url, "_blank", "noopener,noreferrer");
										setTimeout(() => URL.revokeObjectURL(url), 1000);
									}}
									className={clsx(
										"inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] sm:text-xs text-blue-600 hover:bg-blue-50 transition-all duration-300 dark:text-blue-300 dark:hover:bg-slate-800"
									)}
									aria-label={`Open ${file.name}`}
								>
									<Eye className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => onRemove(file)}
									className={clsx(
										"inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] sm:text-xs text-red-500 hover:bg-red-500/10 transition-all duration-300"
									)}
									aria-label={`Remove ${file.name}`}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						</li>
					))}
					{filteredFiles.length > visibleCount && (
						<div className="pt-2 text-center">
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									setVisibleCount((v) => v + 50);
								}}
								className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition dark:text-blue-400 dark:hover:text-blue-300"
							>
								Show more ({filteredFiles.length - visibleCount} files)
							</button>
						</div>
					)}
				</ul>
			)}
		</div>
	);
};

const UploadBox = ({
	hasFiles,
	inputRef,
	onSelect,
}: {
	hasFiles: boolean;
	inputRef: React.RefObject<HTMLInputElement | null>;
	onSelect: (files: FileList | null) => void;
}) => {
	return (
		<div
			className={clsx(
				"w-full",
				hasFiles && "lg:w-[260px] lg:sticky lg:top-4 lg:self-start"
			)}
		>
			<label
				className={clsx(
					"flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-blue-200 p-6 text-xs sm:text-sm text-blue-600",
					"hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer",
					"dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-800/70",
					!hasFiles && "min-h-[40vh]"
				)}
			>
				<Upload className="h-5 w-5 text-blue-600 dark:text-blue-300" />
				<span>Upload resumes</span>
				<span
					className={clsx(
						"text-[11px] sm:text-xs text-blue-500 dark:text-slate-400"
					)}
				>
					PDF, DOC, DOCX only
				</span>
				<input
					ref={inputRef}
					type="file"
					multiple
					accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
					className="hidden"
					onChange={(event) => onSelect(event.target.files)}
					onClick={(event) => {
						// allow selecting the same files repeatedly without manual upload click
						(event.currentTarget as HTMLInputElement).value = "";
					}}
				/>
			</label>
		</div>
	);
};

const AnalyseButton = ({
	disabled,
	loading,
	onClick,
	fileCount,
}: {
	disabled: boolean;
	loading: boolean;
	onClick: () => void;
	fileCount: number;
}) => {
	return (
		<Tooltip content={null}>
			<div className="w-full">
				<button
					type="button"
					disabled={loading || disabled}
					onClick={onClick}
					className={clsx(
						"w-full rounded-md bg-linear-to-r from-[#009ad5] to-[#005ca9] text-white p-2 transition-all duration-300",
						loading || disabled
							? "opacity-60 cursor-not-allowed"
							: "hover:from-[#009ad5] hover:to-[#005ca9] hover:scale-[0.99]"
					)}
				>
					{loading ? "Sending..." : "Send for Analysis"}
				</button>
			</div>
		</Tooltip>
	);
};

const ResumeProcess = () => {
	const searchParams = useSearchParams();
	const preselectedJobId = useMemo(() => {
		const param = searchParams.get("jobId")?.trim();
		if (!param) return "";
		return Number.isFinite(Number(param)) ? param : "";
	}, [searchParams]);

	const preSelectedAccountId = useMemo(() => {
		const param = searchParams.get("accountId")?.trim();
		if (!param) return "";
		return Number.isFinite(Number(param)) ? param : "";
	}, [searchParams]);

	const [step, setStep] = useState<"select-job" | "upload-resumes">(
		preselectedJobId && preSelectedAccountId ? "upload-resumes" : "select-job"
	);
	const [selectedJobId, setSelectedJobId] = useState<string>(
		preselectedJobId || ""
	);
	const [files, setFiles] = useState<File[]>([]);
	const [filter, setFilter] = useState<"all" | "docs" | "pdf">("all");
	const [isFilesExpanded, setIsFilesExpanded] = useState(true);
	const [aiPrompt, setAiPrompt] = useState<string>("");
	const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const {
		processResumes,
		loadingProcessResumes,
		enhanceResumeAiPrompt,
		loadingEnhanceAiPrompt,
		uploadStatus,
		uploadTotal,
		uploadUploaded,
		uploadFailed,
		resetUploadState,
	} = useResumeStore();
	const {
		jobSearchResults,
		loadingJobSearch,
		searchJobs,
		jobs,
		loadingJobs,
		getJobs,
		hasLoadedJobs,
	} = useJobStore();

	const maxFileSizeBytes = 20 * 1024 * 1024;
	const maxFilesPerRequest = 500;

	useEffect(() => {
		if (!preSelectedAccountId) return;
		searchJobs(preSelectedAccountId, "");
	}, [searchJobs, preSelectedAccountId]);

	useEffect(() => {
		if (step === "select-job" && !hasLoadedJobs && preSelectedAccountId) {
			getJobs("", "created_at", "desc", preSelectedAccountId, 1, true);
		}
	}, [step, hasLoadedJobs, getJobs, preSelectedAccountId]);

	const activeJobId = preselectedJobId || selectedJobId;
	const shouldWarnBeforeUnload =
		uploadStatus === "uploading" || loadingProcessResumes;

	useEffect(() => {
		if (!shouldWarnBeforeUnload) return;
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue =
				"Uploads are still running. Leaving now will stop the uploads and lose progress.";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [shouldWarnBeforeUnload]);

	const handleFiles = (selected: FileList | null) => {
		if (!selected) return;
		const incoming = Array.from(selected);
		setFiles((prev) => {
			const seen = new Set(
				prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
			);
			const deduped = incoming.filter(
				(file) => !seen.has(`${file.name}-${file.size}-${file.lastModified}`)
			);

			const totalProposed = prev.length + deduped.length;
			if (totalProposed > maxFilesPerRequest) {
				warningToast("Maximum 500 files per request.");
				const allowedNew = Math.max(0, maxFilesPerRequest - prev.length);
				return [...prev, ...deduped.slice(0, allowedNew)];
			}
			return [...prev, ...deduped];
		});
		if (inputRef.current) inputRef.current.value = "";
	};

	const removeFile = (fileToRemove: File) => {
		setFiles((prev) => prev.filter((f) => f !== fileToRemove));
	};
	const clearFiles = () => {
		setFiles([]);
		setFilter("all");
		if (inputRef.current) inputRef.current.value = "";
	};

	const hasFiles = files.length > 0;
	const hasOversizeFiles = files.some((file) => file.size > maxFileSizeBytes);
	const exceedsFileCount = files.length > maxFilesPerRequest;
	const handleProcess = async () => {
		if (!files.length || loadingProcessResumes) return;
		if (exceedsFileCount) {
			warningToast("You can send up to 500 files per request.");
			return;
		}
		if (hasOversizeFiles) {
			warningToast("Some files exceed 20 MB. Remove them to continue.");
			return;
		}
		if (!activeJobId) {
			warningToast("Please select a job before sending resumes.");
			return;
		}
		const status = await processResumes(
			files,
			Number(activeJobId),
			preSelectedAccountId,
			aiPrompt.trim() || undefined,
			{
				onComplete: () => {
					successToast(
						"Uploads completed. Resumes are being analyzed in the background."
					);
					setFiles([]);
					setFilter("all");
					setAiPrompt("");
					if (!preselectedJobId) {
						setSelectedJobId("");
					}
					resetUploadState(preSelectedAccountId);
				},
				onFailed: (message) => {
					if (message) {
						warningToast(message);
					}
				},
			}
		);
		if (status === 202) {
			successToast("Upload started. You can continue working.");
		}
	};

	const activeJobs = jobs.filter((j) => j.is_active !== false);

	const getHeaderContent = () => {
		switch (step) {
			case "select-job":
				return {
					title: "Select Job Position",
					subtitle: "Analyze Jobs Resumes by AI",
				};
			case "upload-resumes":
				return {
					title: "Upload Resumes",
					subtitle: "Analyze Jobs Resumes by AI",
				};
		}
	};
	const headerContent = getHeaderContent();

	const renderAiPromptSection = () => (
		<div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 mt-4 overflow-hidden mb-6">
			<button
				type="button"
				className="flex w-full items-center justify-between p-5 text-[15px] font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
				onClick={() => setIsAiPromptOpen((prev) => !prev)}
			>
				<div className="flex items-center gap-2">
					<Sparkles className="w-5 h-5 text-violet-500" />
					<span>
						AI Prompt{" "}
						<span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
							(optional)
						</span>
					</span>
				</div>
				<span className="text-slate-400 font-medium text-sm">
					{isAiPromptOpen ? "Hide" : "Show"}
				</span>
			</button>
			{isAiPromptOpen && (
				<div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
					<p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
						Add custom instructions to guide the AI when analyzing resumes for
						this batch. Use the tags below to trigger automatic actions.
					</p>

					<div className="mb-4 flex flex-wrap gap-2">
						{AI_PROMPT_TAGS.map((tag) => (
							<button
								key={tag.label}
								type="button"
								onClick={() =>
									setAiPrompt((prev) =>
										prev ? `${prev}\n${tag.value}` : tag.value
									)
								}
								className={clsx(
									"rounded-[8px] border px-3 py-1.5 text-xs font-medium transition-colors",
									tag.label === "[deny]"
										? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400"
										: tag.label === "[shortlist]"
											? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400"
											: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800/50 dark:bg-green-950/30 dark:text-green-400"
								)}
							>
								{tag.label}
							</button>
						))}
						<button
							type="button"
							disabled={!aiPrompt.trim() || loadingEnhanceAiPrompt}
							onClick={async () => {
								const enhanced = await enhanceResumeAiPrompt(
									aiPrompt.trim(),
									preSelectedAccountId,
									activeJobId ? Number(activeJobId) : undefined
								);
								if (enhanced) setAiPrompt(enhanced);
							}}
							className="inline-flex items-center gap-1.5 rounded-[8px] bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-900/40 dark:text-violet-300"
						>
							<Sparkles className="h-3.5 w-3.5" />
							{loadingEnhanceAiPrompt ? "Enhancing…" : "Enhance with AI"}
						</button>
					</div>

					<textarea
						value={aiPrompt}
						onChange={(e) => setAiPrompt(e.target.value)}
						placeholder={`e.g.\n[shortlist] candidate has 3+ years of Next.js experience\n[deny] candidate does not have React experience\n[send invitation] candidate has a portfolio`}
						rows={6}
						className={clsx(
							"w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all",
							"focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
							"dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
						)}
					/>
					<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
						Click a tag to insert it, then describe the condition. One rule per
						line.
					</p>
				</div>
			)}
		</div>
	);

	return (
		<div className={clsx("space-y-6 w-full mx-auto")}>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						{headerContent.title}
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						{headerContent.subtitle}
					</p>
				</div>
				{step === "upload-resumes" && !preselectedJobId && (
					<button
						onClick={() => {
							setStep("select-job");
						}}
						className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
					>
						Back
					</button>
				)}
			</div>

			{step === "select-job" && (
				<div className="mt-4 space-y-4">
					{loadingJobs ? (
						<div className="text-center py-10 text-slate-500">
							Loading active jobs...
						</div>
					) : (
						<div className="space-y-3">
							{activeJobs.length === 0 && (
								<div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
									No active jobs found.
								</div>
							)}
							{activeJobs.map((job) => (
								<label
									key={job.id}
									className={clsx(
										"flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all duration-300",
										activeJobId === String(job.id)
											? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10"
											: "border-slate-200 hover:border-blue-300 bg-white dark:bg-slate-900 dark:border-slate-800"
									)}
								>
									<div className="flex items-center gap-4">
										<div className="flex items-center justify-center w-5 h-5">
											<input
												type="radio"
												name="jobSelection"
												value={job.id}
												checked={activeJobId === String(job.id)}
												onChange={() => setSelectedJobId(String(job.id))}
												className="w-4 h-4 text-[#005ca9] border-slate-300 focus:ring-[#005ca9]"
											/>
										</div>
										<div>
											<div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
												{job.title}
											</div>
											<div className="text-xs text-slate-500 mt-1 dark:text-slate-400">
												Select to analyze resumes
											</div>
										</div>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
										<FileText className="w-3.5 h-3.5" />
										<span>Select this job</span>
									</div>
								</label>
							))}
						</div>
					)}

					<div className="pt-6">
						<button
							type="button"
							disabled={!activeJobId}
							onClick={() => {
								setStep("upload-resumes");
							}}
							className={clsx(
								"w-full rounded-md bg-[#005ca9] text-white py-3.5 font-medium transition-all duration-300",
								!activeJobId
									? "opacity-60 cursor-not-allowed"
									: "hover:bg-[#004a87] hover:scale-[0.99]"
							)}
						>
							<Sparkles className="w-4 h-4 inline-block mr-2" />
							Next: Upload Resumes
						</button>
					</div>
				</div>
			)}

			{step === "upload-resumes" && (
				<div className="mt-4 space-y-6">
					<div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
								<Briefcase className="w-5 h-5" />
							</div>
							<div>
								<p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">
									Selected Job
								</p>
								<p className="text-[15px] font-bold text-slate-900 dark:text-white">
									{jobs.find((j) => String(j.id) === activeJobId)?.title ||
										"Selected Job"}
								</p>
							</div>
						</div>
						<button
							onClick={() => setStep("select-job")}
							className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-4"
						>
							Change Job
						</button>
					</div>
					<div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
						<div
							className={clsx(
								"flex flex-col items-start gap-4 lg:flex-row p-6"
							)}
						>
							<UploadBox
								hasFiles={hasFiles}
								inputRef={inputRef}
								onSelect={handleFiles}
							/>
							{hasFiles && (
								<div className="w-full">
									<SelectedFilesList
										files={files}
										filter={filter}
										isExpanded={isFilesExpanded}
										listId="selected-files-list"
										maxFileSizeBytes={maxFileSizeBytes}
										onClear={clearFiles}
										onFilterChange={setFilter}
										onRemove={removeFile}
										onToggle={() => setIsFilesExpanded((prev) => !prev)}
									/>
								</div>
							)}
						</div>
						{hasFiles && (
							<div className="p-6 pt-0">
								{renderAiPromptSection()}

								<button
									type="button"
									disabled={
										hasOversizeFiles ||
										exceedsFileCount ||
										loadingProcessResumes ||
										!activeJobId
									}
									onClick={handleProcess}
									className={clsx(
										"w-full rounded-md bg-[#005ca9] text-white py-3.5 font-medium transition-all duration-300 mt-2",
										hasOversizeFiles ||
											exceedsFileCount ||
											loadingProcessResumes ||
											!activeJobId
											? "opacity-60 cursor-not-allowed"
											: "hover:bg-[#004a87] hover:scale-[0.99]"
									)}
								>
									<Sparkles className="w-4 h-4 inline-block mr-2" />
									Analyze Uploaded Resumes
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{exceedsFileCount && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-100">
					Maximum limits reached. Remove files to continue.
				</div>
			)}
			{hasOversizeFiles && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-100">
					One or more files exceed 20 MB. Remove them to continue.
				</div>
			)}
			{shouldWarnBeforeUnload && (
				<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
					Uploads are running. Please do not refresh or close the page, or you
					will lose progress.
				</div>
			)}
			{uploadStatus === "uploading" && (
				<div className="rounded-md border border-blue-200 bg-white p-3 text-xs text-blue-700 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200">
					Uploading {uploadUploaded}/{uploadTotal} files
					{uploadFailed > 0 ? ` (${uploadFailed} failed)` : ""}.
				</div>
			)}
		</div>
	);
};

export default ResumeProcess;
