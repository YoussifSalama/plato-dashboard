"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type AppThemeProviderProps = {
	children: ReactNode;
};

const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
	return (
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
			{children}
		</ThemeProvider>
	);
};

export default AppThemeProvider;
