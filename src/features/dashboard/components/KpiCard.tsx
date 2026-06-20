import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: number | null;
  icon?: ReactNode;
}

export function KpiCard({ label, value, trend, icon }: KpiCardProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-elevated">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-xl transition-opacity group-hover:opacity-80"
        aria-hidden
      />
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:h-[18px] [&_svg]:w-[18px]">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-[28px] font-bold leading-none tracking-tight">{value}</span>
        {trend != null && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              positive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </Card>
  );
}
