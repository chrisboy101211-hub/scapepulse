import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
}

const StatCard = ({ title, value, change, icon: Icon }: StatCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.05)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-xs ${change >= 0 ? "text-neon-green" : "text-destructive"}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(change)}% from last week</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
