"use client";

import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Suspense } from "react";

const ResumesHeader = () => {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	void searchParams; // consumed to satisfy hook usage
	const isAnalyzePage = pathname.startsWith("/resumes/analyse");

	if (isAnalyzePage) return null;

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 px-2">
			<div>
				<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
					Resumes
				</h2>
				<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
					Review & Manage your resumes and track applications
				</p>
			</div>
		</div>
	);
};

const ResumesLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<Suspense fallback={null}>
				<ResumesHeader />
			</Suspense>
			<div className={clsx("space-y-4")}>
				{children}
			</div>
		</>
	);
};

export default ResumesLayout;
