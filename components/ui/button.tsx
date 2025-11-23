import * as React from "react";
import { cn } from "@/lib/utils";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  fullWidth?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "sm", fullWidth, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-xl text-xs font-medium transition tap";
    const variants = { 
      default:"bg-black text-white hover:opacity-90", 
      outline:"border border-gray-300 hover:bg-gray-50", 
      ghost:"hover:bg-gray-100",
      destructive:"bg-red-600 text-white hover:bg-red-700"
    };
    const sizes = { 
      sm:"h-8 px-3 text-xs", 
      md:"h-9 px-3.5 text-xs", 
      lg:"h-10 px-4 text-sm",
      icon:"h-8 w-8 p-0"
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)} {...props} />;
  }
);
Button.displayName = "Button";
