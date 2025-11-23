"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className, ...props }, ref) => (<TabsPrimitive.List ref={ref} className={cn("inline-flex gap-2 rounded-2xl bg-gray-100 p-2 overflow-x-auto", className)} {...props} />)
);
TabsList.displayName = "TabsList";
export const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className, ...props }, ref) => (<TabsPrimitive.Trigger ref={ref} className={cn("px-3 py-1.5 text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap", className)} {...props} />)
);
TabsTrigger.displayName = "TabsTrigger";
export const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({ className, ...props }, ref) => (<TabsPrimitive.Content ref={ref} className={cn(className)} {...props} />)
);
TabsContent.displayName = "TabsContent";
