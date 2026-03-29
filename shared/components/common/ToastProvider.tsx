"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import { apiClient } from "@/lib/apiClient";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const ToastProvider = () => {
	const router = useRouter();
	const socketRef = useRef<Socket | null>(null);
	const isConnectingRef = useRef(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const playNotificationSound = async () => {
		if (typeof window === "undefined") return;
		if (!audioRef.current) {
			audioRef.current = new Audio(
				"/sounds/smooth-completed-notify-starting-alert-274739.mp3"
			);
		}
		audioRef.current.currentTime = 0;
		await audioRef.current.play();
	};

	// useEffect(() => {
	// 	let isActive = true;
	// 	let retryTimer: ReturnType<typeof setInterval> | null = null;

	// 	const connectSocket = async () => {
	// 		if (!isActive || socketRef.current || isConnectingRef.current) return;
	// 		const token = Cookies.get(ACCESS_TOKEN_KEY);
	// 		if (!token) return;
	// 		isConnectingRef.current = true;
	// 		try {
	// 			const response = await apiClient.get("/agency/inbox/agency", {
	// 				headers: { Authorization: `Bearer ${token}` },
	// 			});
	// 			const agencyId =
	// 				response.data?.data?.agency_id ?? response.data?.agency_id;
	// 			const baseUrl = process.env.NEXT_PUBLIC_API_URL;
	// 			if (!agencyId || !baseUrl || !isActive) return;

	// 			const socket = io(`${baseUrl}/agency`, {
	// 				transports: ["websocket"],
	// 			});
	// 			socketRef.current = socket;
	// 			socket.emit("inbox.join", { agencyId });
	// 			socket.on("inbox.created", (payload: Record<string, unknown>) => {
	// 				const title = (payload.title as string) ?? "New inbox item";
	// 				const description =
	// 					(payload.description as string) ?? "A new inbox item is available.";
	// 				const type = payload.type as string;

	// 				if (typeof window !== "undefined") {
	// 					window.dispatchEvent(
	// 						new CustomEvent("inbox:created", { detail: payload }) // Keep existing event
	// 					);
	// 					// Also dispatch a specific event if needed, but the generic one is used by InboxPage
	// 				}
	// 				playNotificationSound().catch(() => {
	// 					// ignore audio playback errors
	// 				});

	// 				toast(title, {
	// 					description,
	// 					action: {
	// 						label: "View",
	// 						onClick: () => {
	// 							if (type === "application" && payload.job_id) {
	// 								router.push(`/jobs/${payload.job_id}/applications`);
	// 							} else if (
	// 								type === "interview" &&
	// 								payload.interview_session_id
	// 							) {
	// 								router.push(`/interviews/${payload.interview_session_id}`);
	// 							} else {
	// 								router.push("/inbox");
	// 							}
	// 						},
	// 					},
	// 				});
	// 			});
	// 		} catch {
	// 			// ignore connection failures
	// 		} finally {
	// 			isConnectingRef.current = false;
	// 		}
	// 	};

	// 	void connectSocket();
	// 	retryTimer = setInterval(() => {
	// 		void connectSocket();
	// 	}, 2000);

	// 	return () => {
	// 		isActive = false;
	// 		if (retryTimer) clearInterval(retryTimer);
	// 		socketRef.current?.disconnect();
	// 		socketRef.current = null;
	// 	};
	// }, [router]);

	return <Toaster />;
};

export default ToastProvider;
