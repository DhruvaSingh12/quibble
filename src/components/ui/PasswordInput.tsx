import React, {useState } from "react"
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input, InputProps } from "./Input";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props}, ref) => {
        const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative">
            <Input
            type={showPassword ? "text" : "password"}
            className={cn("pe-10 text-gray-600" , className)}
            ref={ref}
            {...props}
            />
            <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide Password" : "Show password"}
            className="absolute inset-y-0 end-0 flex items-center pe-3"
            >
                {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-600" />
                ) : (
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                )}
            </button>
        </div>
    )
})

PasswordInput.displayName = "PasswordInput";

export { PasswordInput};