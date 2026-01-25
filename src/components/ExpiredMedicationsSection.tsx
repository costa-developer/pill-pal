import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RotateCcw, Archive, ChevronDown, ChevronUp, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
    <div className="mb-8 animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-warning/10 border border-warning/30 rounded-xl hover:bg-warning/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-semibold text-foreground">
              Expired Prescriptions
            </h3>
            <p className="text-sm text-muted-foreground">
              {medications.length} prescription{medications.length !== 1 ? 's' : ''} need{medications.length === 1 ? 's' : ''} attention
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="med-card border-warning/30 bg-card/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center opacity-60"
                    style={{ backgroundColor: med.color || '#0077b6' }}
                  >
                    <Pill className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground">
                      {med.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-warning border-warning/50">
                        Expired {med.end_date && formatDistanceToNow(new Date(med.end_date), { addSuffix: true })}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
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
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        disabled={archivingId === med.id}
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive this prescription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove "{med.name}" from your active medications. 
                          You can view archived medications in your history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleArchive(med.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Prescription</DialogTitle>
            <DialogDescription>
              Renew "{selectedMedication?.name}" for a new period starting today.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              New Duration
            </label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              The prescription will be active from today for {selectedDuration} days.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenew} disabled={renewingId !== null}>
              {renewingId ? 'Renewing...' : 'Renew Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
