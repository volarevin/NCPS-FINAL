import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 mb-8 animate-slide-in", className)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B4F6C] dark:text-primary tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm md:text-base text-gray-500 dark:text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className="h-px bg-gray-200 dark:bg-border w-full" />
    </div>
  );
}
