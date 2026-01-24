import { useState } from 'react';
import { z } from 'zod';
import { Plus, Pill, X, CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  timeOfDay: z.array(z.string()).min(1, 'Select at least one time'),
  instructions: z.string().optional(),
  color: z.string(),
  medicationType: z.enum(['one-time', 'prescription', 'as-needed']),
  durationDays: z.number().nullable(),
});

interface AddMedicationDialogProps {
  onAdd: (medication: {
    name: string;
    dosage: string;
    frequency: string;
    time_of_day: string[];
    instructions?: string;
    color: string;
    medication_type: string;
    duration_days: number | null;
    start_date: string;
    end_date: string | null;
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

const COLORS = [
  { name: 'Blue', value: '#0077b6' },
  { name: 'Teal', value: '#00b4d8' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
];

const TIMES = [
  'Morning (8:00 AM)',
  'Noon (12:00 PM)',
  'Afternoon (3:00 PM)',
  'Evening (6:00 PM)',
  'Night (9:00 PM)',
  'Bedtime (10:00 PM)',
];

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every other day',
  'Weekly',
  'As needed',
];

const MEDICATION_TYPES = [
  { value: 'one-time', label: 'One-time', description: 'Single dose (e.g., headache pill)' },
  { value: 'prescription', label: 'Prescription', description: 'Course for a period of time' },
  { value: 'as-needed', label: 'As Needed', description: 'Take when required (not tracked)' },
];

const DURATION_PRESETS = [
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'Ongoing', days: null },
];

export function AddMedicationDialog({ onAdd, trigger }: AddMedicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [medicationType, setMedicationType] = useState<'one-time' | 'prescription' | 'as-needed'>('prescription');
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [customDuration, setCustomDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('');
    setSelectedTimes([]);
    setInstructions('');
    setColor(COLORS[0].value);
    setMedicationType('prescription');
    setDurationDays(null);
    setStartDate(new Date());
    setCustomDuration('');
    setErrors({});
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleDurationChange = (days: number | null) => {
    setDurationDays(days);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDurationDays(parsed);
    }
  };

  const calculateEndDate = (): string | null => {
    if (medicationType === 'one-time') {
      return startDate.toISOString();
    }
    if (durationDays === null) {
      return null; // Ongoing
    }
    return addDays(startDate, durationDays).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      medicationSchema.parse({
        name,
        dosage,
        frequency,
        timeOfDay: selectedTimes,
        instructions,
        color,
        medicationType,
        durationDays,
      });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    try {
      await onAdd({
        name,
        dosage,
        frequency,
        time_of_day: selectedTimes,
        instructions: instructions || undefined,
        color,
        medication_type: medicationType,
        duration_days: medicationType === 'one-time' ? 1 : durationDays,
        start_date: startDate.toISOString(),
        end_date: calculateEndDate(),
      });
      toast.success('Medication added successfully!');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Failed to add medication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="hero" size="lg">
            <Plus className="w-5 h-5" />
            Add Medication
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            Add New Medication
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Medication Type Selection */}
          <div className="space-y-2">
            <Label>What type of medication is this?</Label>
            <div className="grid grid-cols-3 gap-2">
              {MEDICATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMedicationType(type.value as 'one-time' | 'prescription' | 'as-needed')}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-200 text-left",
                    medicationType === type.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Medication Name</Label>
            <Input
              id="name"
              placeholder="e.g., Aspirin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="med-input"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 100mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="med-input"
              />
              {errors.dosage && <p className="text-sm text-destructive">{errors.dosage}</p>}
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="med-input">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-sm text-destructive">{errors.frequency}</p>}
            </div>
          </div>

          {/* Duration Section - Only show for prescriptions */}
          {medicationType === 'prescription' && (
            <div className="space-y-3 p-4 rounded-xl bg-secondary/50">
              <Label>Prescription Duration</Label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleDurationChange(preset.days)}
                    className={cn(
                      "pill-badge",
                      durationDays === preset.days
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground border border-border"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Or custom:</span>
                <Input
                  type="number"
                  placeholder="Days"
                  value={customDuration}
                  onChange={(e) => handleCustomDurationChange(e.target.value)}
                  className="w-24 med-input"
                  min="1"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>

              <div className="space-y-2 mt-3">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal med-input",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {durationDays && (
                <p className="text-sm text-muted-foreground">
                  Ends on: {format(addDays(startDate, durationDays), "PPP")}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Time of Day</Label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className={`pill-badge ${
                    selectedTimes.includes(time)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {time.split(' ')[0]}
                  {selectedTimes.includes(time) && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
            {errors.timeOfDay && <p className="text-sm text-destructive">{errors.timeOfDay}</p>}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Take with food"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="med-input resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add Medication'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
