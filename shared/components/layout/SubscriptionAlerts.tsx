import Link from "next/link";

interface Props {
    pathname: string;
    shouldBlock: boolean;
    isSubscriptionExpired: boolean;
    isTrialing: boolean;
    trialEndDate?: string | null;
}

const SubscriptionAlerts = ({
    pathname,
    shouldBlock,
    isSubscriptionExpired,
    isTrialing,
    trialEndDate,
}: Props) => {
    return (
        <>
            {shouldBlock && !pathname.startsWith("/settings") && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3 text-amber-900 dark:text-amber-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                            Create or join an organization to unlock the employer dashboard.
                        </p>
                        <Link
                            href="/settings"
                            className="inline-flex items-center rounded-md bg-amber-600 dark:bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 dark:hover:bg-amber-600"
                        >
                            Go to settings
                        </Link>
                    </div>
                </div>
            )}

            {isSubscriptionExpired && !pathname.startsWith("/billing") && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950/40 px-4 py-3 text-red-900 dark:text-red-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            Your subscription has expired or payment failed. You cannot post new jobs or use AI features until you renew.
                        </p>
                        <Link
                            href="/billing"
                            className="inline-flex items-center rounded-md bg-red-600 dark:bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 dark:hover:bg-red-600"
                        >
                            Renew Subscription
                        </Link>
                    </div>
                </div>
            )}

            {isTrialing && !pathname.startsWith("/billing") && (
                <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40 px-4 py-3 text-blue-900 dark:text-blue-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">🎉</span>
                            You are currently on a free trial! Your trial ends on{" "}
                            {trialEndDate ? new Date(trialEndDate).toLocaleDateString() : "—"}.
                        </p>
                        <Link
                            href="/billing"
                            className="inline-flex items-center rounded-[10px] bg-[#10B981] dark:bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#10B981]/80 dark:hover:bg-emerald-600"
                        >
                            View Plan
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
};

export default SubscriptionAlerts;
