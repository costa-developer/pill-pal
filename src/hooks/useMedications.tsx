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
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
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
    logs,
    loading,
    addMedication,
    markAsTaken,
    deleteMedication,
    isTakenToday,
    refetch: () => Promise.all([fetchMedications(), fetchTodayLogs()]),
  };
}
