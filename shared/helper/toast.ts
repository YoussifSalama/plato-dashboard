import { toast } from "sonner";

export const successToast = (message: string) => {
    toast.success(message);
};

export const errorToast = (message: string) => {
    toast.error(message);
};

export const warningToast = (message: string) => {
    toast.warning(message);
};

export const infoToast = (message: string) => {
    toast(message);
};