import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/hooks/useMedications';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MedicationCard } from '@/components/MedicationCard';
import { AddMedicationDialog } from '@/components/AddMedicationDialog';
import { EditMedicationDialog } from '@/components/EditMedicationDialog';
import { ExpiredMedicationsSection } from '@/components/ExpiredMedicationsSection';
import { StatsCard } from '@/components/StatsCard';
import { Pill, CheckCircle2, Clock, Loader2, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    medications,
    expiredMedications,
    loading: medsLoading,
    addMedication,
    updateMedication,
    markAsTaken,
    deleteMedication,
    renewMedication,
    archiveMedication,
    isTakenToday,
  } = useMedications();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<typeof medications[0] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || medsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <div className="absolute inset-0 animate-ping">
            <Loader2 className="w-10 h-10 text-primary/30" />
          </div>
        </div>
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
      toast.success('Great job! 💪', {
        description: 'Medication marked as taken',
      });
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
    const med = medications.find((m) => m.id === id);
    if (med) {
      setMedicationToEdit(med);
      setEditDialogOpen(true);
    }
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

  const greeting = getTimeOfDay();
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="floating-pill-1" />
      <div className="floating-pill-2" />
      <div className="floating-pill-3" />

      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section - More dynamic */}
        <div className="mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {format(today, 'EEEE, MMMM d')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight">
            Good {greeting},{' '}
            <span className="text-gradient">{userName}</span>
            <span className="inline-block ml-2 animate-bounce-subtle">
              {greeting === 'morning' ? '☀️' : greeting === 'afternoon' ? '🌤️' : '🌙'}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-lg">
            {takenDoses === totalDoses && totalDoses > 0
              ? "You've completed all your medications for today! 🎉"
              : totalDoses - takenDoses === 1
              ? "Just one more to go - you're almost there!"
              : `You have ${totalDoses - takenDoses} dose${totalDoses - takenDoses !== 1 ? 's' : ''} remaining today.`}
          </p>
        </div>

        {/* Stats Grid - Bento style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-slide-up-delay">
          <StatsCard
            title="Active Meds"
            value={medications.length}
            icon={Pill}
            subtitle={`${medications.length} medication${medications.length !== 1 ? 's' : ''}`}
            variant="gradient"
            accentColor="#0EA5E9"
          />
          <StatsCard
            title="Today's Doses"
            value={`${takenDoses}/${totalDoses}`}
            icon={CheckCircle2}
            subtitle={totalDoses - takenDoses > 0 ? `${totalDoses - takenDoses} remaining` : 'All done! 🎉'}
            trend={takenDoses === totalDoses ? 'up' : 'neutral'}
            accentColor="#10B981"
          />
          <StatsCard
            title="Adherence"
            value={`${adherenceRate}%`}
            icon={TrendingUp}
            subtitle={adherenceRate >= 80 ? 'Excellent!' : adherenceRate >= 50 ? 'Good progress' : 'Keep going!'}
            trend={adherenceRate >= 80 ? 'up' : adherenceRate >= 50 ? 'neutral' : 'down'}
            accentColor="#8B5CF6"
          />
          <StatsCard
            title="Streak"
            value="7 days"
            icon={Zap}
            subtitle="You're on fire! 🔥"
            trend="up"
            accentColor="#F59E0B"
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
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Today's Schedule
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Your medications organized by time
            </p>
          </div>
          <AddMedicationDialog onAdd={addMedication} />
        </div>

        {medications.length === 0 ? (
          <div className="bento-card text-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center mb-6 blob">
              <Pill className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">
              No medications yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Start your health journey by adding your first medication to track.
            </p>
            <AddMedicationDialog onAdd={addMedication} />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(medicationsByTime)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([time, meds], groupIndex) => {
                const takenCount = meds.filter((m) => isTakenToday(m.id, time)).length;
                const allTaken = takenCount === meds.length;
                
                return (
                  <div 
                    key={time} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${groupIndex * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        allTaken ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        <Clock className={`w-5 h-5 ${allTaken ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-lg">{time}</h3>
                        <p className="text-sm text-muted-foreground">
                          {takenCount}/{meds.length} completed
                        </p>
                      </div>
                      {allTaken && (
                        <span className="ml-auto pill-badge bg-success/10 text-success border border-success/20">
                          ✓ All done
                        </span>
                      )}
                    </div>
                    <div className="grid gap-4">
                      {meds.map((med, index) => (
                        <div 
                          key={`${med.id}-${time}`}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <MedicationCard
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
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Edit Medication Dialog */}
        <EditMedicationDialog
          medication={medicationToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={updateMedication}
        />
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
