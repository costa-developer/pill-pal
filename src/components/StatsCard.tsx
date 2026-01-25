import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  variant?: 'default' | 'gradient' | 'outline';
  accentColor?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = 'default',
  accentColor,
}: StatsCardProps) {
  const isGradient = variant === 'gradient';
  const isOutline = variant === 'outline';

  return (
    <div
      className={cn(
        'bento-card group relative',
        isGradient && 'bento-card-accent',
        isOutline && 'border-gradient',
        className
      )}
    >
      {/* Decorative corner accent */}
      <div
        className="absolute -top-1 -right-1 w-20 h-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accentColor || 'hsl(var(--primary))' }}
      />

      <div className="relative flex flex-col h-full">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="icon-container w-12 h-12"
            style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}10 100%)` } : undefined}
          >
            <Icon 
              className="w-5 h-5 relative z-10" 
              style={{ color: accentColor || 'hsl(var(--primary))' }}
            />
          </div>
          
          {/* Trend indicator */}
          {trend && (
            <div
              className={cn(
                'px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
                trend === 'up' && 'bg-success/10 text-success',
                trend === 'down' && 'bg-destructive/10 text-destructive',
                trend === 'neutral' && 'bg-muted text-muted-foreground'
              )}
            >
              {trend === 'up' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className="sr-only">{trend}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex-grow">
          <p className="stat-number mb-1">{value}</p>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p
              className={cn(
                'text-sm font-medium',
                trend === 'up' && 'text-success',
                trend === 'down' && 'text-destructive',
                (!trend || trend === 'neutral') && 'text-muted-foreground'
              )}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
