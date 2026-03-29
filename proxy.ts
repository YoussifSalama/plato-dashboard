import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isAuthRoute = pathname.startsWith("/auth");
	const isPublicFile =
		pathname.startsWith("/_next") ||
		pathname.startsWith("/favicon") ||
		pathname.startsWith("/brand") ||
		pathname.startsWith("/assets") ||
		pathname.startsWith("/public") ||
		pathname.startsWith("/api");

	const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;

	if (isAuthRoute) {
		if (accessToken) {
			const dashboardUrl = request.nextUrl.clone();
			dashboardUrl.pathname = "/";
			return NextResponse.redirect(dashboardUrl);
		}
		return NextResponse.next();
	}

	if (isPublicFile) {
		return NextResponse.next();
	}

	if (!accessToken) {
		const loginUrl = request.nextUrl.clone();
		loginUrl.pathname = "/auth/login";
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|assets).*)"],
};
