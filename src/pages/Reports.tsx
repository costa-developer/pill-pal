import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, subMonths } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useReports, ReportData } from '@/hooks/useReports';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { generateMedicationReportPDF } from '@/lib/pdfGenerator';
import { 
  FileText, 
  Download, 
  Loader2, 
  TrendingUp, 
  Pill, 
  Calendar, 
  CheckCircle2,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { loading, reportData, generateReport } = useReports();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleGenerateReport = async (period: 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
    try {
      await generateReport(period);
      setHasGenerated(true);
    } catch {
      // Error handled in hook
    }
  };

  const handleDownloadPDF = (includeAI: boolean) => {
    if (!reportData) return;
    
    try {
      const filename = generateMedicationReportPDF({
        reportData,
        includeAI,
        userName: user?.email?.split('@')[0],
      });
      toast.success(`Report downloaded: ${filename}`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
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

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getAdherenceProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-success';
    if (rate >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Health Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate AI-powered insights on your medication adherence
          </p>
        </div>

        {/* Period Selection */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={selectedPeriod === 'weekly' && hasGenerated ? 'default' : 'outline'}
            onClick={() => handleGenerateReport('weekly')}
            disabled={loading}
            className="gap-2"
          >
            {loading && selectedPeriod === 'weekly' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            Generate Weekly Report
          </Button>
          <Button
            variant={selectedPeriod === 'monthly' && hasGenerated ? 'default' : 'outline'}
            onClick={() => handleGenerateReport('monthly')}
            disabled={loading}
            className="gap-2"
          >
            {loading && selectedPeriod === 'monthly' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            Generate Monthly Report
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="mb-8">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                Generating Your Report
              </h3>
              <p className="text-muted-foreground">
                Our AI is analyzing your medication patterns...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Medications</p>
                      <p className="text-2xl font-display font-bold text-foreground">
                        {reportData.totalMedications}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Doses Taken</p>
                      <p className="text-2xl font-display font-bold text-foreground">
                        {reportData.takenDoses}/{reportData.expectedDoses}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Adherence Rate</p>
                      <p className={cn(
                        "text-2xl font-display font-bold",
                        getAdherenceColor(reportData.adherenceRate)
                      )}>
                        {reportData.adherenceRate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Period</p>
                      <p className="text-2xl font-display font-bold text-foreground">
                        {reportData.periodDays} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medication Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medication Breakdown
                </CardTitle>
                <CardDescription>
                  Adherence rate per medication for {format(new Date(reportData.startDate), 'MMM d')} - {format(new Date(reportData.endDate), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.medicationStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No medications tracked during this period.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reportData.medicationStats.map((med, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-foreground">{med.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {med.dosage} • {med.taken}/{med.expected} doses
                            </p>
                          </div>
                          <span className={cn(
                            "text-lg font-bold",
                            getAdherenceColor(med.adherence)
                          )}>
                            {med.adherence}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                              getAdherenceProgressColor(med.adherence)
                            )}
                            style={{ width: `${med.adherence}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                  AI Health Insights
                </CardTitle>
                <CardDescription>
                  Personalized analysis of your medication patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <div className="whitespace-pre-wrap">{reportData.aiInsights}</div>
                </div>
              </CardContent>
            </Card>

            {/* Download Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Report
                </CardTitle>
                <CardDescription>
                  Choose your preferred report format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => handleDownloadPDF(true)}
                  >
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span className="font-semibold">AI Insights Report</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Summary with AI-generated health insights and recommendations
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => handleDownloadPDF(false)}
                  >
                    <ClipboardList className="w-6 h-6 text-primary" />
                    <span className="font-semibold">Full Medication Log</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Complete log of all medications taken with timestamps
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasGenerated && (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 rounded-2xl gradient-soft mx-auto flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                Generate Your First Report
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Choose a time period above to generate an AI-powered analysis of your medication adherence.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
