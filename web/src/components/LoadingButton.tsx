import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./ui/Button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends ButtonProps{
    loading: boolean;
}

export default function LoadingButton({ loading, disabled, className, ...props }: LoadingButtonProps) {
  return (
    <Button
    disabled={disabled || loading}
    className={cn("flex items-center justify-center gap-2", className)}
    {...props}
    >{loading && <Loader2 className="size-5 animate-spin"/>}
    {props.children}
    </Button>
  );
}