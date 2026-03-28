import {
	type LucideIcon,
	Home,
	Briefcase,
	Users,
	CalendarDays,
	Mail,
	BarChart2,
	Settings,
	HelpCircle,
	CreditCard,
	Tag,
	Cpu,
	Sparkles,
	LayoutDashboardIcon,
	LucideBriefcaseBusiness,
	Calendar,
	Gift,
	PaperclipIcon,
	Plane,
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
		href: "/qoutas",
	},
	{
		label: "Vouchers",
		icon: Gift,
		href: "vouchers",
	},
	{
		label: "Content",
		icon: FileText,
		href: "content",
	},
	{
		label: "Analytics",
		icon: ChartColumn,
		href: "analytics",
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
