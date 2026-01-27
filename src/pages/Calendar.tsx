import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/hooks/useMedications';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WeeklyCalendarView } from '@/components/WeeklyCalendarView';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Calendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { medications, logs, loading: medsLoading, isTakenToday } = useMedications();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Start week on Monday
  );

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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="floating-pill-1" />
      <div className="floating-pill-2" />

      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-button flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                Weekly Schedule
              </h1>
              <p className="text-muted-foreground">
                View your medication schedule for the week
              </p>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 animate-slide-up-delay">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
              className="rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              className="rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            {!isCurrentWeek && (
              <Button
                variant="ghost"
                onClick={goToCurrentWeek}
                className="rounded-xl text-primary"
              >
                Today
              </Button>
            )}
          </div>
          <div className="text-lg font-display font-semibold text-foreground">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "text-center p-3 rounded-xl transition-all",
                isToday(day) 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50"
              )}
            >
              <div className="text-xs font-medium uppercase tracking-wider opacity-70">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                "text-2xl font-display font-bold mt-1",
                isToday(day) ? "text-primary-foreground" : "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Calendar Grid */}
        <WeeklyCalendarView
          medications={medications}
          weekDays={weekDays}
          logs={logs}
        />
      </main>
    </div>
  );
}
