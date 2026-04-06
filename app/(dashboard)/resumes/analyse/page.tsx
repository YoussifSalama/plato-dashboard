import { Suspense } from "react";
import ResumeProcess from "@/shared/components/pages/resume/process/ResumeProcess";

const ResumeBatchesPage = () => {
    return (
        <Suspense
            fallback={
                <div className="rounded-md border border-blue-200 bg-white p-6 text-sm text-blue-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-100">
                    Loading resume analysis...
                </div>
            }
        >
            <ResumeProcess />
        </Suspense>
    );
};

export default ResumeBatchesPage;

