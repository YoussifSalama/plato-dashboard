import { Cpu, FileText, LucideIcon } from "lucide-react";

export interface ITab {
    label: string;
    icon: LucideIcon;
    href: string;
}

export const resumeTabs: ITab[] = [
    {
        label: "All Resumes",
        icon: FileText,
        href: "/resumes",
    },
    {
        label: "Analyse Resumes",
        icon: Cpu,
        href: "/resumes/analyse",
    },
];