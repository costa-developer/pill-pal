import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RotateCcw, Archive, ChevronDown, ChevronUp, Pill, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ExpiredMedication {
  id: string;
  name: string;
  dosage: string;
  color: string | null;
  end_date: string | null;
  duration_days: number | null;
  time_of_day: string[];
}

interface ExpiredMedicationsSectionProps {
  medications: ExpiredMedication[];
  onRenew: (id: string, durationDays: number) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

export function ExpiredMedicationsSection({
  medications,
  onRenew,
  onArchive,
}: ExpiredMedicationsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('30');
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<ExpiredMedication | null>(null);

  if (medications.length === 0) return null;

  const handleRenew = async () => {
    if (!selectedMedication) return;
    
    setRenewingId(selectedMedication.id);
    try {
      await onRenew(selectedMedication.id, parseInt(selectedDuration));
      setRenewDialogOpen(false);
      setSelectedMedication(null);
    } finally {
      setRenewingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      await onArchive(id);
    } finally {
      setArchivingId(null);
    }
  };

  const openRenewDialog = (medication: ExpiredMedication) => {
    setSelectedMedication(medication);
    setSelectedDuration(medication.duration_days?.toString() || '30');
    setRenewDialogOpen(true);
  };

  return (
    <div className="mb-10 animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-5 rounded-3xl transition-all duration-300",
          "bg-gradient-to-r from-amber/10 via-amber/5 to-transparent",
          "border border-amber/30 hover:border-amber/50",
          "group"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6 text-amber" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-bold text-lg text-foreground">
              Expired Prescriptions
            </h3>
            <p className="text-sm text-muted-foreground">
              {medications.length} prescription{medications.length !== 1 ? 's' : ''} need{medications.length === 1 ? 's' : ''} your attention
            </p>
          </div>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center transition-transform",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown className="w-5 h-5 text-amber" />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {medications.map((med, index) => (
            <div
              key={med.id}
              className="bento-card border-amber/20 bg-card/80"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center opacity-70"
                    style={{ backgroundColor: `${med.color || '#0077b6'}15` }}
                  >
                    <Pill className="w-7 h-7" style={{ color: med.color || '#0077b6' }} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-lg text-foreground">
                      {med.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-amber border-amber/40 bg-amber/10 rounded-full">
                        ⏰ Expired {med.end_date && formatDistanceToNow(new Date(med.end_date), { addSuffix: true })}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl border-primary/30 hover:border-primary hover:bg-primary/10"
                    onClick={() => openRenewDialog(med)}
                    disabled={renewingId === med.id}
                  >
                    <RotateCcw className={cn("w-4 h-4", renewingId === med.id && "animate-spin")} />
                    Renew
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground rounded-xl"
                        disabled={archivingId === med.id}
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Archive this prescription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove "{med.name}" from your active medications. 
                          You can view archived medications in your history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleArchive(med.id)}
                          className="rounded-xl"
                        >
                          Archive
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renew Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl">Renew Prescription</DialogTitle>
            <DialogDescription>
              Renew "{selectedMedication?.name}" for a new period starting today.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Select Duration
            </label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="rounded-lg"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-3">
              The prescription will be active from today for {selectedDuration} days.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setRenewDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenew} 
              disabled={renewingId !== null}
              className="rounded-xl gradient-button text-white"
            >
              {renewingId ? 'Renewing...' : 'Renew Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
