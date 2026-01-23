import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CheckCircle2, XCircle, Loader2, Pill, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  medication_id: string;
  taken_at: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  medication: {
    name: string;
    dosage: string;
    color: string | null;
  };
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, selectedDays]);

  const fetchLogs = async () => {
    if (!user) return;

    setLoading(true);
    const startDate = startOfDay(subDays(new Date(), selectedDays));

    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select(`
          *,
          medication:medications(name, dosage, color)
        `)
        .gte('taken_at', startDate.toISOString())
        .order('taken_at', { ascending: false });

      if (error) throw error;
      setLogs((data as LogEntry[]) || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Group logs by date
  const logsByDate = logs.reduce(
    (acc, log) => {
      const date = format(new Date(log.taken_at), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    },
    {} as Record<string, LogEntry[]>
  );

  // Calculate stats
  const totalLogs = logs.length;
  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const adherenceRate = totalLogs > 0 ? Math.round((takenCount / totalLogs) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Medication History
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your medication adherence over time
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
        </div>

        {/* Time Period Selector */}
        <div className="flex gap-2 mb-8">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              variant={selectedDays === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDays(days)}
            >
              {days} days
            </Button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="med-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doses Taken</p>
                <p className="text-2xl font-display font-bold text-foreground">{takenCount}</p>
              </div>
            </div>
          </div>
          <div className="med-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adherence Rate</p>
                <p className="text-2xl font-display font-bold text-foreground">{adherenceRate}%</p>
              </div>
            </div>
          </div>
          <div className="med-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-2xl font-display font-bold text-foreground">{selectedDays} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs by Date */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="med-card text-center py-16">
            <div className="w-20 h-20 rounded-2xl gradient-soft mx-auto flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              No history yet
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start tracking your medications to build your health history.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(logsByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dayLogs]) => (
                <div key={date} className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground">
                      {format(new Date(date), 'EEEE, MMMM d')}
                    </h3>
                    <span className="pill-badge bg-success/10 text-success">
                      {dayLogs.filter((l) => l.status === 'taken').length} taken
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${log.medication.color || '#0077b6'}20` }}
                        >
                          <Pill
                            className="w-5 h-5"
                            style={{ color: log.medication.color || '#0077b6' }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{log.medication.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.medication.dosage} • {log.scheduled_time}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.taken_at), 'h:mm a')}
                          </span>
                          {log.status === 'taken' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                      </div>
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
