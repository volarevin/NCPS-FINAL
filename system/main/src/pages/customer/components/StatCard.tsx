// import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, color = "#4DBDCC", className }: StatCardProps) {
  return (
    <Card className={`border-l-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 dark:bg-card dark:border-border ${className}`} style={{ borderLeftColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4" style={{ color: color }} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#0B4F6C] dark:text-primary">{value}</div>
        {trend && <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

