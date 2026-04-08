import ResumeDetailsClient from "@/shared/components/pages/resume/details/ResumeDetailsClient";

const ResumeDetailsPage = async ({
    params,
}: {
    params: Promise<{ id: string }>;
}) => {
    const { id } = await params;
    return <ResumeDetailsClient resumeId={id} />;
};

export default ResumeDetailsPage;