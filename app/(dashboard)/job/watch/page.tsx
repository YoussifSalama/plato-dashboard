import { Suspense } from "react";
import JobWatchForm from "@/shared/components/pages/job/JobWatchForm";

const EditJobPage = () => {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center py-20">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#005ca9]" />
				</div>
			}
		>
			<JobWatchForm />
		</Suspense>
	);
};

export default EditJobPage;
