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
		href: "/none3",
	},
	{
		label: "Content",
		icon: FileText,
		href: "/none4",
	},
	{
		label: "Analytics",
		icon: ChartColumn,
		href: "/none5",
	},
];

export const bottomRoutes: ISidebarRoute[] = [
	{
		label: "Settings",
		icon: Settings,
		href: "/none6",
	},
	// {
	// 	label: "Help Center",
	// 	icon: HelpCircle,
	// 	href: "/help-center",
	// },
];
