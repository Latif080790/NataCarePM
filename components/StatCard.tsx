// FIX: Provide content for the missing StatCard component.
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { LucideProps } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<LucideProps>;
  description?: string;
  color?: string;
}

export function StatCard({ title, value, icon: Icon, description, color = 'text-persimmon' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-palladium">{description}</p>}
      </CardContent>
    </Card>
  );
}
