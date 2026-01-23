import { useState } from 'react';
import { Check, Clock, MoreVertical, Pill, Edit, Trash2 } from 'lucide-react';
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
  isTaken?: boolean;
  onMarkTaken: (id: string, time: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MedicationCard({
  id,
  name,
  dosage,
  time,
  instructions,
  color = '#0077b6',
  isTaken = false,
  onMarkTaken,
  onEdit,
  onDelete,
}: MedicationCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMarkTaken = () => {
    if (!isTaken) {
      setIsAnimating(true);
      setTimeout(() => {
        onMarkTaken(id, time);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div
      className={cn(
        'med-card relative overflow-hidden transition-all duration-300',
        isTaken && 'opacity-75',
        isAnimating && 'scale-95'
      )}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between pl-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Pill className="w-6 h-6" style={{ color }} />
          </div>

          {/* Info */}
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">{name}</h3>
            <p className="text-muted-foreground">{dosage}</p>
            {instructions && (
              <p className="text-sm text-muted-foreground mt-1">{instructions}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{time}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Take button */}
          <Button
            variant={isTaken ? 'success' : 'outline'}
            size="sm"
            onClick={handleMarkTaken}
            disabled={isTaken}
            className={cn(
              'transition-all duration-300',
              isTaken && 'cursor-default'
            )}
          >
            <Check className="w-4 h-4" />
            {isTaken ? 'Taken' : 'Take'}
          </Button>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
