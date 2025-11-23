import * as React from "react";
import { cn } from "@/lib/utils";
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("w-full rounded-2xl border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300", className)} {...props} />
));
Textarea.displayName = "Textarea";
