import * as React from "react";
import { cn } from "@/lib/utils";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full h-11 rounded-2xl border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 appearance-none [-webkit-appearance:none] leading-normal", className)} {...props} />
));
Input.displayName = "Input";
