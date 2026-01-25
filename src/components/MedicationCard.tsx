import { useState } from 'react';
import { Check, Clock, MoreVertical, Pill, Edit, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MedicationCardProps {
  id: string;
  name: string;
  dosage: string;
  time: string;
  instructions?: string;
  color?: string;
  medicationType?: 'one-time' | 'prescription' | 'as-needed';
  isTaken?: boolean;
  onMarkTaken: (id: string, time: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; className: string }> = {
  'one-time': { 
    label: 'One-time', 
    icon: '⚡',
    className: 'bg-coral/10 text-coral border-coral/20' 
  },
  'prescription': { 
    label: 'Rx', 
    icon: '💊',
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  'as-needed': { 
    label: 'PRN', 
    icon: '🎯',
    className: 'bg-lavender/10 text-lavender border-lavender/20' 
  },
};

export function MedicationCard({
  id,
  name,
  dosage,
  time,
  instructions,
  color = '#0EA5E9',
  medicationType = 'prescription',
  isTaken = false,
  onMarkTaken,
  onEdit,
  onDelete,
}: MedicationCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const typeConfig = TYPE_CONFIG[medicationType] || TYPE_CONFIG.prescription;

  const handleMarkTaken = () => {
    if (!isTaken) {
      setIsAnimating(true);
      setShowConfetti(true);
      setTimeout(() => {
        onMarkTaken(id, time);
        setIsAnimating(false);
      }, 400);
      setTimeout(() => setShowConfetti(false), 1000);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-3xl border border-border/60 p-5 transition-all duration-500',
        'bg-card hover:shadow-lg',
        isTaken && 'bg-success/5 border-success/30',
        isAnimating && 'scale-[0.98]'
      )}
      style={{
        boxShadow: isTaken 
          ? `0 0 30px ${color}15` 
          : undefined
      }}
    >
      {/* Animated gradient border on hover */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: `linear-gradient(135deg, ${color}10 0%, transparent 50%)`,
        }}
      />

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-success animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '600ms',
              }}
              size={12}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Pill Icon with organic shape */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
              "group-hover:scale-110 group-hover:rotate-3",
              isTaken && "scale-95"
            )}
            style={{ 
              backgroundColor: `${color}15`,
              boxShadow: `0 8px 24px ${color}20`
            }}
          >
            <Pill 
              className={cn(
                "w-7 h-7 transition-transform duration-300",
                isTaken && "rotate-12"
              )} 
              style={{ color }} 
            />
          </div>
          {/* Status indicator */}
          {isTaken && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-lg animate-scale-in">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={cn(
                "font-display font-semibold text-lg text-foreground truncate transition-all",
                isTaken && "line-through decoration-2 decoration-success/50 text-muted-foreground"
              )}>
                {name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-muted-foreground font-medium">{dosage}</span>
                <span 
                  className={cn(
                    "pill-badge text-[10px] border",
                    typeConfig.className
                  )}
                >
                  {typeConfig.icon} {typeConfig.label}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant={isTaken ? 'ghost' : 'default'}
                size="sm"
                onClick={handleMarkTaken}
                disabled={isTaken}
                className={cn(
                  'rounded-xl transition-all duration-300 btn-interactive',
                  isTaken 
                    ? 'bg-success/10 text-success hover:bg-success/20 cursor-default' 
                    : 'gradient-button text-white shadow-md hover:shadow-lg'
                )}
              >
                <Check className={cn("w-4 h-4 mr-1.5", isAnimating && "animate-bounce")} />
                {isTaken ? 'Done!' : 'Take'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => onEdit(id)} className="rounded-lg">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-destructive focus:text-destructive rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Instructions */}
          {instructions && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
              {instructions}
            </p>
          )}

          {/* Time badge */}
          <div className="flex items-center gap-2 mt-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground text-sm font-medium">
              <Clock className="w-3.5 h-3.5" />
              {time}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
