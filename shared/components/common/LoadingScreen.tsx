"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
	isVisible: boolean;
	message?: string;
}

const LOADING_MESSAGES = [
	"Preparing your dashboard...",
	"Analyzing metrics...",
	"Fetching latest data...",
	"Setting up your workspace...",
];

export default function LoadingScreen({
	isVisible,
	message,
}: LoadingScreenProps) {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (message) return;

		const interval = setInterval(() => {
			setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
		}, 3000);

		return () => {
			clearInterval(interval);
			setIndex(0);
		};
	}, [message]);

	const currentMessage = message ?? LOADING_MESSAGES[index];

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md"
				>
					<div className="relative flex flex-col items-center">
						<motion.div
							animate={{
								scale: [1, 1.05, 1],
								opacity: [0.8, 1, 0.8],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeInOut",
							}}
							className="mb-8"
						>
							<img
								src="/brand/plato-logo.png"
								alt="Plato"
								className="h-auto w-32 dark:invert"
							/>
						</motion.div>

						<div className="w-64 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4 shadow-inner">
							<motion.div
								initial={{ x: "-100%" }}
								animate={{ x: "100%" }}
								transition={{
									duration: 1.5,
									repeat: Infinity,
									ease: "easeInOut",
								}}
								className="w-full h-full bg-linear-to-r from-transparent via-blue-600 to-transparent"
							/>
						</div>

						<AnimatePresence mode="wait">
							<motion.p
								key={currentMessage}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.3 }}
								className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide"
							>
								{currentMessage}
							</motion.p>
						</AnimatePresence>
					</div>

					<div className="absolute bottom-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
						Super Admin Dashboard
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
