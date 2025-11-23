"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
  ({ className, ...props }, ref) => (<DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 bg-black/40 z-50", className)} {...props} />)
);
DialogOverlay.displayName = "DialogOverlay";
export const DialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} className={cn("fixed left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 shadow-lg overflow-y-auto z-50", className)} {...props} />
    </DialogPortal>
  )
);
DialogContent.displayName = "DialogContent";
export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("mb-2", className)} {...props} />);
export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (<h2 className={cn("text-lg font-semibold", className)} {...props} />);
export const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (<p className={cn("text-sm text-gray-500", className)} {...props} />);
export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("mt-4 flex flex-col sm:flex-row sm:justify-end gap-2", className)} {...props} />);
