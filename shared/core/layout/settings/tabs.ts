import { Building2, KeyRound, Palette, Users, User } from "lucide-react";
import type { ITab } from "@/shared/core/layout/resume/tabs";

export const settingsTabs: ITab[] = [
    {
        label: "Agency",
        icon: Building2,
        href: "/settings",
    },
    {
        label: "Account",
        icon: User,
        href: "/settings/account",
    },
    {
        label: "Password",
        icon: KeyRound,
        href: "/settings/password",
    },
    {
        label: "Team",
        icon: Users,
        href: "/settings/team",
    },
    {
        label: "Branding",
        icon: Palette,
        href: "/settings/branding",
    },
];

