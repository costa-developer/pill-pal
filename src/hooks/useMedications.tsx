import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

export function useMedications() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [expiredMedications, setExpiredMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedications = async () => {
    if (!user) return;
    
    try {
      const now = new Date().toISOString();
      
      // Fetch active medications (not expired)
      const { data: activeData, error: activeError } = await supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .or(`end_date.is.null,end_date.gt.${now}`)
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;
      setMedications(activeData || []);

      // Fetch expired prescriptions (end_date passed, still marked active)
      const { data: expiredData, error: expiredError } = await supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .eq('medication_type', 'prescription')
        .not('end_date', 'is', null)
        .lt('end_date', now)
        .order('end_date', { ascending: false });

      if (expiredError) throw expiredError;
      setExpiredMedications(expiredData || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast.error('Failed to load medications');
    }
  };

  const fetchTodayLogs = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .gte('taken_at', today.toISOString())
        .order('taken_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const addMedication = async (medication: {
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
  }) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('medications').insert({
      user_id: user.id,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      time_of_day: medication.time_of_day,
      instructions: medication.instructions,
      color: medication.color,
      medication_type: medication.medication_type,
      duration_days: medication.duration_days,
      start_date: medication.start_date,
      end_date: medication.end_date,
    });

    if (error) throw error;
    await fetchMedications();
  };

  const markAsTaken = async (medicationId: string, scheduledTime: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('medication_logs').insert({
      user_id: user.id,
      medication_id: medicationId,
      scheduled_time: scheduledTime,
      status: 'taken',
    });

    if (error) throw error;
    await fetchTodayLogs();
  };

  const deleteMedication = async (id: string) => {
    const { error } = await supabase
      .from('medications')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await fetchMedications();
  };

  const renewMedication = async (id: string, durationDays: number) => {
    if (!user) throw new Error('Not authenticated');

    const newStartDate = new Date();
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + durationDays);

    const { error } = await supabase
      .from('medications')
      .update({
        start_date: newStartDate.toISOString(),
        end_date: newEndDate.toISOString(),
        duration_days: durationDays,
      })
      .eq('id', id);

    if (error) throw error;
    await fetchMedications();
  };

  const archiveMedication = async (id: string) => {
    const { error } = await supabase
      .from('medications')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await fetchMedications();
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchMedications(), fetchTodayLogs()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user]);

  const isTakenToday = (medicationId: string, time: string): boolean => {
    return logs.some(
      (log) =>
        log.medication_id === medicationId &&
        log.scheduled_time === time &&
        log.status === 'taken'
    );
  };

  return {
    medications,
    expiredMedications,
    logs,
    loading,
    addMedication,
    markAsTaken,
    deleteMedication,
    renewMedication,
    archiveMedication,
    isTakenToday,
    refetch: () => Promise.all([fetchMedications(), fetchTodayLogs()]),
  };
}
