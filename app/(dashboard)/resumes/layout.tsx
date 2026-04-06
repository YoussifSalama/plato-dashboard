"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { useMemo } from "react";

const ResumesLayout = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const preSelectedAccountId = useMemo(() => {
		const param = searchParams.get("accountId")?.trim();
		if (!param) return "";
		return Number.isFinite(Number(param)) ? param : "";
	}, [searchParams]);
	const isDetailsPage =
		pathname.startsWith("/resumes/") &&
		pathname !== "/resumes" &&
		!pathname.startsWith("/resumes/analyse");

	const isAnalyzePage = pathname.startsWith("/resumes/analyse");

	return (
		<>
			{!isAnalyzePage && (
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
			)}
			<div className={clsx("space-y-4")}>
				{/* agency/jobs/search */}
				{children}
			</div>
		</>
	);
};

export default ResumesLayout;
