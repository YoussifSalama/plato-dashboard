"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";

const ResumeClient = dynamic(
    () => import("@/shared/components/pages/resume/all/ResumeClient"),
    { ssr: false }
);

const AllResumesPage = () => {
    return (
        <div
            className={clsx(

                "dark:border-slate-700/60 dark:shadow-none"
            )}
        >

            <ResumeClient />
        </div>
    );
};

export default AllResumesPage;

