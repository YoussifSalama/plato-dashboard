"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeSwitch() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 0);
		return () => clearTimeout(timer);
	}, []);

	if (!mounted) {
		return (
			<button
				type="button"
				className="text-slate-400 h-[38px] w-[38px] flex items-center justify-center p-2"
				aria-label="Toggle theme placeholder"
			>
				<div className="h-[22px] w-[22px]"></div>
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			className="text-slate-400 transition-colors h-[38px] w-[38px] flex items-center justify-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
			aria-label="Toggle theme"
		>
			{resolvedTheme === "dark" ? (
				<Sun
					className="h-[22px] w-[22px] text-slate-400 dark:text-slate-500"
					strokeWidth={2}
				/>
			) : (
				<Moon
					className="h-[22px] w-[22px] text-slate-400 dark:text-slate-500"
					strokeWidth={2}
				/>
			)}
		</button>
	);
}
