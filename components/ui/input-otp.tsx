"use client"

import * as React from "react"
import { OTPInput, type OTPInputProps, type SlotProps } from "input-otp"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
    React.ElementRef<typeof OTPInput>,
    OTPInputProps
>(({ className, ...props }, ref) => (
    <OTPInput
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
    />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex items-center gap-2", className)} {...props} />
)
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<HTMLDivElement, SlotProps>(
    ({ char, hasFakeCaret, isActive, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-center text-sm font-semibold text-slate-900 shadow-sm",
                "transition-all focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200",
                "dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100 dark:focus-within:ring-slate-700",
                isActive && "border-slate-400 ring-2 ring-slate-200 dark:border-slate-500 dark:ring-slate-700"
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-px animate-pulse bg-slate-900 dark:bg-slate-100" />
                </div>
            )}
        </div>
    )
)
InputOTPSlot.displayName = "InputOTPSlot"

export { InputOTP, InputOTPGroup, InputOTPSlot }

