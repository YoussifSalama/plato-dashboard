"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const evaluationSchema = z.object({
	key: z.string().min(1, "Evaluation key is required."),
	value: z.string().min(1, "Evaluation value is required."),
});

const aiPromptSchema = z.object({
	target: z.string().min(1, "Target is required."),
	prompt: z.string().min(1, "Prompt is required."),
	evaluation: z
		.array(evaluationSchema)
		.min(1, "Add at least one evaluation item."),
});

export type AiPromptFormValues = z.infer<typeof aiPromptSchema>;

const JobAiPromptModal = ({
	open,
	onOpenChange,
	onSubmit,
	loading,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: AiPromptFormValues) => Promise<void> | void;
	loading: boolean;
}) => {
	const {
		register,
		handleSubmit,
		formState: { errors, isValid, isDirty, isSubmitting },
		control,
		reset,
	} = useForm<AiPromptFormValues>({
		defaultValues: {
			target: "",
			prompt: "",
			evaluation: [{ key: "", value: "" }],
		},
		mode: "onChange",
		resolver: zodResolver(aiPromptSchema),
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "evaluation",
	});

	const handleClose = (nextOpen: boolean) => {
		onOpenChange(nextOpen);
		if (!nextOpen) {
			reset({
				target: "",
				prompt: "",
				evaluation: [{ key: "", value: "" }],
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-h-[70vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>AI Prompt (Optional)</DialogTitle>
					<DialogDescription>
						Add an AI prompt to guide how resumes are evaluated for this job.
						You can skip this and add it later.
					</DialogDescription>
				</DialogHeader>
				<form
					className="space-y-4"
					onSubmit={handleSubmit(async (values) => onSubmit(values))}
				>
					<div className="space-y-2">
						<label className="text-sm font-medium text-blue-700 dark:text-slate-200">
							Target
						</label>
						<Input placeholder="e.g., resume" {...register("target")} />
						{errors.target && (
							<p className="text-xs text-red-500">{errors.target.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-blue-700 dark:text-slate-200">
							Prompt
						</label>
						<Textarea
							placeholder="Describe how the AI should evaluate candidates..."
							className="min-h-[120px]"
							{...register("prompt")}
						/>
						{errors.prompt && (
							<p className="text-xs text-red-500">{errors.prompt.message}</p>
						)}
					</div>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium text-blue-700 dark:text-slate-200">
								Evaluation items
							</label>
							<Button
								type="button"
								variant="outline"
								onClick={() => append({ key: "", value: "" })}
							>
								Add item
							</Button>
						</div>
						{fields.map((field, index) => (
							<div
								key={field.id}
								className="mx-auto w-full max-w-2xl rounded-md border border-blue-100 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-900/60"
							>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="space-y-2">
										<label className="text-xs font-medium text-slate-600 dark:text-slate-300">
											Key
										</label>
										<Input
											placeholder="e.g., experience"
											{...register(`evaluation.${index}.key`)}
										/>
										{errors.evaluation?.[index]?.key && (
											<p className="text-xs text-red-500">
												{errors.evaluation[index]?.key?.message}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<label className="text-xs font-medium text-slate-600 dark:text-slate-300">
											Value
										</label>
										<Input
											placeholder="e.g., 3+ years"
											{...register(`evaluation.${index}.value`)}
										/>
										{errors.evaluation?.[index]?.value && (
											<p className="text-xs text-red-500">
												{errors.evaluation[index]?.value?.message}
											</p>
										)}
									</div>
								</div>
								<div className="mt-3 flex justify-end">
									<Button
										type="button"
										variant="ghost"
										className="text-red-600 hover:text-red-700"
										onClick={() => remove(index)}
									>
										Remove
									</Button>
								</div>
							</div>
						))}
						{errors.evaluation &&
							typeof errors.evaluation?.message === "string" && (
								<p className="text-xs text-red-500">
									{errors.evaluation.message}
								</p>
							)}
					</div>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleClose(false)}
						>
							Skip for now
						</Button>
						<Button
							type="submit"
							disabled={loading || isSubmitting || !isValid || !isDirty}
							className="rounded-md bg-linear-to-r from-[#009ad5] to-[#005ca9] text-white hover:from-[#009ad5] hover:to-[#005ca9]"
						>
							{loading ? "Saving..." : "Save AI Prompt"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default JobAiPromptModal;
