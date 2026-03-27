type ApiMessagePayload = {
    message?: string;
    data?: {
        message?: string;
    };
};

export const resolveResponseMessage = (
    response: unknown,
    fallback: string
) => {
    if (!response || typeof response !== "object") return fallback;
    const data = (response as { data?: ApiMessagePayload }).data;
    return data?.message ?? data?.data?.message ?? fallback;
};

export const resolveErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
        const message = (error as { response?: { data?: ApiMessagePayload } })?.response?.data?.message;
        if (message) return message;
    }
    return fallback;
};

