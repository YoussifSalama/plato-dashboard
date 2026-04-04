import {
	type LucideIcon,
	Users,
	Settings,
	CreditCard,
	LayoutDashboardIcon,
	LucideBriefcaseBusiness,
	Calendar,
	Gift,
	ChartColumn,
	FileText,
	Gauge,
	DatabaseBackup,
	Database,
} from "lucide-react";

export interface ISidebarRoute {
	label: string;
	icon: LucideIcon;
	href: string;
}

export const sidebarRoutes: ISidebarRoute[] = [
	{
		label: "Dashboard",
		icon: LayoutDashboardIcon,
		href: "/",
	},
	{
		label: "Users",
		icon: Users,
		href: "/users",
	},
	{
		label: "Jobs",
		icon: LucideBriefcaseBusiness,
		href: "/jobs",
	},
	{
		label: "Candidates",
		icon: Users,
		href: "/candidates",
	},
	{
		label: "Interviews",
		icon: Calendar,
		href: "/interviews",
	},
	{
		label: "Subscriptions",
		icon: CreditCard,
		href: "/subscriptions",
	},
	{
		label: "Qoutas",
		icon: Gauge,
		href: "/quotas",
	},
	{
		label: "Vouchers",
		icon: Gift,
		href: "/vouchers",
	},
	{
		label: "Content",
		icon: FileText,
		href: "/content",
	},
	{
		label: "Analytics",
		icon: ChartColumn,
		href: "/analytics",
	},
	{
		label: "Logs",
		icon: Database,
		href: "/logs",
	},
];

export const bottomRoutes: ISidebarRoute[] = [
	{
		label: "Settings",
		icon: Settings,
		href: "/settings",
	},
	// {
	// 	label: "Help Center",
	// 	icon: HelpCircle,
	// 	href: "/help-center",
	// },
];
