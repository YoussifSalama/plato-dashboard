import clsx from "clsx";
import { Briefcase, FileText, LucideIcon, Sparkles, Users } from "lucide-react";
import Image from "next/image";

interface Feature {
	icon: LucideIcon;
	title: string;
}

const features: Feature[] = [
	{ icon: Sparkles, title: "AI insights" },
	{ icon: FileText, title: "Smart parsing" },
	{ icon: Briefcase, title: "Job matching" },
	{ icon: Users, title: "Team workflow" },
];

const BrandSide = () => {
	return (
		<div className="lg:flex-1 max-lg:hidden h-screen relative overflow-hidden">
			<Image
				src="/assets/page/auth/auth-bg.png"
				alt="auth background"
				fill
				className="object-cover"
			/>

			<div
				className={clsx(
					"absolute inset-0 w-full h-full flex flex-col",
					"xl:p-14 lg:p-8"
				)}
			>
				{/* centered content */}
				<div className="flex flex-1 flex-col items-center justify-center">
					<div className="flex items-center gap-3 px-3 mb-6">
						<Image
							alt="auth logo"
							src="/assets/page/auth/logo.png"
							width={107}
							height={107}
							className="object-contain xl:max-w-[107px] xl:max-h-[107px] max-w-[72px] max-h-[72px] invert brightness-0"
						/>
						<h1 className="font-bold xl:text-3xl text-xl  text-white leading-tight">
							Plato Agency
						</h1>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-2 xl:gap-3.5 px-4">
						{features.map((feature) => (
							<FeatureTab
								key={feature.title}
								icon={feature.icon}
								title={feature.title}
							/>
						))}
					</div>

					<div className="space-y-3.5 text-center mt-8 xl:mt-14 px-4">
						<p className="text-white font-bold xl:text-4xl text-2xl xl:leading-[40px] leading-tight">
							Hire faster with resumes that
							<br />
							speak for themselves.
						</p>
						<p className="font-medium xl:text-base text-sm leading-[20px] text-main-crystalBlue/90">
							Keep every candidate, review insights, and collaborate with
							<br className="max-xl:hidden" /> your team in one place.
						</p>
					</div>
				</div>

				{/* always pinned to bottom */}
				<div className="bg-black/30 rounded-[14px] xl:p-8 p-5 space-y-4 xl:space-y-5 text-center">
					<p className="text-main-crystalPeak xl:text-2xl text-lg font-medium leading-snug">
						{"Plato helps us shortlist in hours instead of days."}
					</p>
					<p className="text-main-crystalPeak/80 font-medium xl:text-base text-sm leading-4">
						Talent Ops, Partner Agency
					</p>
				</div>
			</div>
		</div>
	);
};

const FeatureTab = ({ icon: Icon, title }: Feature) => {
	return (
		<div className="bg-white/15 border border-white/30 xl:px-6 xl:py-3 px-3 py-2 flex items-center justify-center gap-2 xl:gap-3.5 font-medium xl:text-lg text-sm rounded-full">
			<Icon className="text-white xl:w-6 xl:h-6 w-4 h-4" />
			<span className="text-white">{title}</span>
		</div>
	);
};

export default BrandSide;
