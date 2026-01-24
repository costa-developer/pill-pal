import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Key, 
  FileText, 
  Loader2, 
  ArrowLeft, 
  LogOut, 
  Search,
  User,
  Pill,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PatientReport {
  patient: { name: string };
  period: string;
  periodDays: number;
  startDate: string;
  endDate: string;
  totalMedications: number;
  expectedDoses: number;
  takenDoses: number;
  adherenceRate: number;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    type: string;
  }>;
  logs: Array<{
    id: string;
    medication_name: string;
    dosage: string;
    taken_at: string;
    scheduled_time: string;
    status: string;
  }>;
}

export default function DoctorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessKey, setAccessKey] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [searching, setSearching] = useState(false);
  const [report, setReport] = useState<PatientReport | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/doctor/auth');
        return;
      }

      // Verify doctor role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'doctor')
        .single();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error('Access denied. Doctor account required.');
        navigate('/doctor/auth');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/doctor/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/doctor/auth');
  };

  const handleSearch = async () => {
    if (!accessKey.trim()) {
      toast.error('Please enter an access key');
      return;
    }

    setSearching(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke('doctor-access', {
        body: { accessKey: accessKey.trim(), period },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setReport(data.data);
      toast.success('Report loaded successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to access report');
      }
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                MedTrack
              </span>
              <Badge variant="secondary" className="ml-2">Doctor</Badge>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Doctor Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter a patient's access key to view their medication report.
          </p>
        </div>

        {/* Search Card */}
        <div className="med-card mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">
                Access Patient Report
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter the access key provided by your patient to view their medication adherence report.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr,auto,auto]">
            <div className="space-y-2">
              <Label htmlFor="accessKey">Access Key</Label>
              <Input
                id="accessKey"
                placeholder="Enter patient's access key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="med-input font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Report Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly')}>
                <SelectTrigger className="med-input w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="hero" onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">View Report</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {report && (
          <div className="space-y-6 animate-fade-in">
            {/* Patient Info */}
            <div className="med-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    {report.patient.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {report.period} report • {format(new Date(report.startDate), 'MMM d')} - {format(new Date(report.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Medications</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{report.totalMedications}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Doses Taken</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{report.takenDoses}/{report.expectedDoses}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Adherence</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{report.adherenceRate}%</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Period</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{report.periodDays} days</p>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="med-card">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Active Medications
              </h3>
              <div className="divide-y divide-border">
                {report.medications.map((med, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{med.name}</p>
                      <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                    </div>
                    <Badge variant="secondary">{med.type}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Logs */}
            <div className="med-card">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Medication Log
              </h3>
              {report.logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No logs for this period</p>
              ) : (
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {report.logs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{log.medication_name}</p>
                          <p className="text-sm text-muted-foreground">{log.dosage} • {log.scheduled_time}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.taken_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              This is a read-only view. Patient data cannot be modified or downloaded.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!report && !searching && (
          <div className="med-card text-center py-16">
            <div className="w-20 h-20 rounded-2xl gradient-soft mx-auto flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              Enter an Access Key
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Request an access key from your patient to view their medication adherence report.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
