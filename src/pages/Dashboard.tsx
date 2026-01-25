import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/hooks/useMedications';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MedicationCard } from '@/components/MedicationCard';
import { AddMedicationDialog } from '@/components/AddMedicationDialog';
import { ExpiredMedicationsSection } from '@/components/ExpiredMedicationsSection';
import { StatsCard } from '@/components/StatsCard';
import { Pill, CheckCircle2, Clock, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    medications,
    expiredMedications,
    loading: medsLoading,
    addMedication,
    markAsTaken,
    deleteMedication,
    renewMedication,
    archiveMedication,
    isTakenToday,
  } = useMedications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || medsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Calculate stats
  const today = new Date();
  const totalDoses = medications.reduce((sum, med) => sum + med.time_of_day.length, 0);
  const takenDoses = medications.reduce((sum, med) => {
    return sum + med.time_of_day.filter((time) => isTakenToday(med.id, time)).length;
  }, 0);
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const handleMarkTaken = async (id: string, time: string) => {
    try {
      await markAsTaken(id, time);
      toast.success('Medication marked as taken!');
    } catch {
      toast.error('Failed to mark medication as taken');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedication(id);
      toast.success('Medication removed');
    } catch {
      toast.error('Failed to remove medication');
    }
  };

  const handleEdit = (id: string) => {
    toast.info('Edit functionality coming soon!');
  };

  // Group medications by time
  const medicationsByTime = medications.reduce(
    (acc, med) => {
      med.time_of_day.forEach((time) => {
        if (!acc[time]) acc[time] = [];
        acc[time].push({ ...med, time });
      });
      return acc;
    },
    {} as Record<string, (typeof medications[0] & { time: string })[]>
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Good {getTimeOfDay()}, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Active Medications"
            value={medications.length}
            icon={Pill}
            subtitle={`${medications.length} medications`}
          />
          <StatsCard
            title="Doses Today"
            value={`${takenDoses}/${totalDoses}`}
            icon={CheckCircle2}
            subtitle={totalDoses - takenDoses > 0 ? `${totalDoses - takenDoses} remaining` : 'All done!'}
            trend={takenDoses === totalDoses ? 'up' : 'neutral'}
          />
          <StatsCard
            title="Today's Adherence"
            value={`${adherenceRate}%`}
            icon={Clock}
            subtitle={adherenceRate >= 80 ? 'Great job!' : 'Keep going!'}
            trend={adherenceRate >= 80 ? 'up' : adherenceRate >= 50 ? 'neutral' : 'down'}
          />
          <StatsCard
            title="This Week"
            value="7 days"
            icon={CalendarDays}
            subtitle="Active streak"
            trend="up"
          />
        </div>

        {/* Expired Prescriptions Section */}
        <ExpiredMedicationsSection
          medications={expiredMedications}
          onRenew={renewMedication}
          onArchive={archiveMedication}
        />

        {/* Medications Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Today's Medications
          </h2>
          <AddMedicationDialog onAdd={addMedication} />
        </div>

        {medications.length === 0 ? (
          <div className="med-card text-center py-16">
            <div className="w-20 h-20 rounded-2xl gradient-soft mx-auto flex items-center justify-center mb-4">
              <Pill className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              No medications yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start by adding your first medication to track your health journey.
            </p>
            <AddMedicationDialog onAdd={addMedication} />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(medicationsByTime)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([time, meds]) => (
                <div key={time} className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground">{time}</h3>
                    <span className="pill-badge bg-secondary text-secondary-foreground">
                      {meds.filter((m) => isTakenToday(m.id, time)).length}/{meds.length} taken
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {meds.map((med) => (
                      <MedicationCard
                        key={`${med.id}-${time}`}
                        id={med.id}
                        name={med.name}
                        dosage={med.dosage}
                        time={time}
                        instructions={med.instructions || undefined}
                        color={med.color || undefined}
                        medicationType={med.medication_type as 'one-time' | 'prescription' | 'as-needed'}
                        isTaken={isTakenToday(med.id, time)}
                        onMarkTaken={handleMarkTaken}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
