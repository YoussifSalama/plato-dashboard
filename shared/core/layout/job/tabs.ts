import { Briefcase, Users } from "lucide-react";
import { ITab } from "@/shared/core/layout/resume/tabs";

export const getJobTabs = (id: string): ITab[] => [
    {
        label: "Overview",
        icon: Briefcase,
        href: `/jobs/${id}`,
    }
];
