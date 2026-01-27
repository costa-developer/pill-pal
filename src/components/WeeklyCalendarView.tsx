import { format, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { Pill, Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  instructions: string | null;
  color: string | null;
  is_active: boolean | null;
  created_at: string;
  medication_type: string;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  taken_at: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
}

interface WeeklyCalendarViewProps {
  medications: Medication[];
  weekDays: Date[];
  logs: MedicationLog[];
}

// Time slots for the calendar
const TIME_SLOTS = [
  { key: 'Morning (8:00 AM)', label: 'Morning', time: '8:00 AM' },
  { key: 'Noon (12:00 PM)', label: 'Noon', time: '12:00 PM' },
  { key: 'Afternoon (3:00 PM)', label: 'Afternoon', time: '3:00 PM' },
  { key: 'Evening (6:00 PM)', label: 'Evening', time: '6:00 PM' },
  { key: 'Night (9:00 PM)', label: 'Night', time: '9:00 PM' },
  { key: 'Bedtime (10:00 PM)', label: 'Bedtime', time: '10:00 PM' },
];

export function WeeklyCalendarView({ medications, weekDays, logs }: WeeklyCalendarViewProps) {
  // Check if a medication was taken on a specific day and time
  const wasTaken = (medicationId: string, day: Date, timeSlot: string): boolean => {
    return logs.some(
      (log) =>
        log.medication_id === medicationId &&
        log.scheduled_time === timeSlot &&
        log.status === 'taken' &&
        isSameDay(new Date(log.taken_at), day)
    );
  };

  // Check if a medication is scheduled for a specific day
  const isScheduledForDay = (medication: Medication, day: Date): boolean => {
    const startDate = medication.start_date ? startOfDay(new Date(medication.start_date)) : null;
    const endDate = medication.end_date ? startOfDay(new Date(medication.end_date)) : null;
    const dayStart = startOfDay(day);

    // If no start date, assume it's always scheduled
    if (!startDate) return true;

    // Check if day is within the medication's active period
    if (isBefore(dayStart, startDate)) return false;
    if (endDate && isBefore(endDate, dayStart)) return false;

    return true;
  };

  // Get medications for a specific time slot
  const getMedicationsForTimeSlot = (timeSlotKey: string): Medication[] => {
    return medications.filter((med) => med.time_of_day.includes(timeSlotKey));
  };

  // Check if there are any medications for the day/time
  const hasScheduledMeds = TIME_SLOTS.some(slot => 
    getMedicationsForTimeSlot(slot.key).some(med => 
      weekDays.some(day => isScheduledForDay(med, day))
    )
  );

  if (medications.length === 0) {
    return (
      <div className="bento-card text-center py-16 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center mb-6">
          <Pill className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground mb-2">
          No medications scheduled
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Add medications from the dashboard to see them in the weekly calendar view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {TIME_SLOTS.map((slot) => {
        const medsForSlot = getMedicationsForTimeSlot(slot.key);
        if (medsForSlot.length === 0) return null;

        return (
          <div key={slot.key} className="bento-card overflow-hidden">
            {/* Time Slot Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-muted/30">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-semibold text-foreground">
                  {slot.label}
                </div>
                <div className="text-sm text-muted-foreground">{slot.time}</div>
              </div>
              <div className="ml-auto pill-badge bg-primary/10 text-primary">
                {medsForSlot.length} med{medsForSlot.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Medications Grid */}
            <div className="p-4">
              {medsForSlot.map((med) => (
                <div key={med.id} className="mb-4 last:mb-0">
                  {/* Medication Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: med.color || '#0EA5E9' }}
                    />
                    <span className="font-medium text-foreground">{med.name}</span>
                    <span className="text-sm text-muted-foreground">({med.dosage})</span>
                  </div>

                  {/* Week Grid for this medication */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const scheduled = isScheduledForDay(med, day);
                      const taken = wasTaken(med.id, day, slot.key);
                      const isPast = isBefore(startOfDay(day), startOfDay(new Date())) && !isToday(day);
                      const isTodayDate = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "relative h-12 rounded-xl flex items-center justify-center transition-all",
                            !scheduled && "bg-muted/20 opacity-40",
                            scheduled && !taken && isPast && "bg-destructive/10 border border-destructive/30",
                            scheduled && taken && "bg-success/20 border border-success/30",
                            scheduled && !taken && !isPast && "bg-muted/40 border border-border/50",
                            isTodayDate && scheduled && !taken && "bg-primary/10 border-2 border-primary/50",
                          )}
                        >
                          {!scheduled ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : taken ? (
                            <div className="flex flex-col items-center">
                              <Check className="w-5 h-5 text-success" />
                            </div>
                          ) : isPast ? (
                            <div className="flex flex-col items-center">
                              <AlertCircle className="w-4 h-4 text-destructive/70" />
                            </div>
                          ) : (
                            <div
                              className="w-4 h-4 rounded-full opacity-60"
                              style={{ backgroundColor: med.color || '#0EA5E9' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center">
            <Check className="w-3 h-3 text-success" />
          </div>
          <span>Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center">
            <AlertCircle className="w-3 h-3 text-destructive/70" />
          </div>
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border-2 border-primary/50" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-muted/40 border border-border/50" />
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}
