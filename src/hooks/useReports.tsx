import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MedicationStat {
  name: string;
  dosage: string;
  frequency: string;
  expected: number;
  taken: number;
  adherence: number;
}

export interface LogEntry {
  id: string;
  medication_id: string;
  taken_at: string;
  scheduled_time: string;
  status: string;
  medication: {
    name: string;
    dosage: string;
    frequency: string;
  };
}

export interface ReportData {
  period: string;
  periodDays: number;
  startDate: string;
  endDate: string;
  totalMedications: number;
  expectedDoses: number;
  takenDoses: number;
  missedDoses: number;
  adherenceRate: number;
  medicationStats: MedicationStat[];
  logs: LogEntry[];
  aiInsights: string;
}

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const generateReport = async (period: 'weekly' | 'monthly', customStartDate?: Date, customEndDate?: Date) => {
    setLoading(true);
    
    try {
      const endDate = customEndDate || new Date();
      let startDate: Date;
      
      if (customStartDate) {
        startDate = customStartDate;
      } else if (period === 'weekly') {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Set times to start/end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setReportData(data.data);
      return data.data;
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    reportData,
    generateReport,
  };
}
