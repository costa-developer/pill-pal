import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface AccessKey {
  id: string;
  key_preview: string;
  label: string | null;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at: string | null;
  use_count: number;
}

interface AccessLog {
  id: string;
  accessed_at: string;
  report_type: string;
}

export function useAccessKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys((data as AccessKey[]) || []);
    } catch (error) {
      console.error('Error fetching access keys:', error);
    }
  };

  const fetchLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('report_access_logs')
        .select('id, accessed_at, report_type')
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data as AccessLog[]) || []);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchKeys(), fetchLogs()]).finally(() => setLoading(false));
    }
  }, [user]);

  const generateKey = async (label?: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('access-keys', {
        body: { action: 'generate', label },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await fetchKeys();
      toast.success('Access key generated successfully!');
      return data.data.key;
    } catch (error) {
      console.error('Error generating key:', error);
      toast.error('Failed to generate access key');
      return null;
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('access_keys')
        .update({ 
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', keyId);

      if (error) throw error;
      await fetchKeys();
      toast.success('Access key revoked');
    } catch (error) {
      console.error('Error revoking key:', error);
      toast.error('Failed to revoke key');
    }
  };

  const deleteKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('access_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
      await fetchKeys();
      toast.success('Access key deleted');
    } catch (error) {
      console.error('Error deleting key:', error);
      toast.error('Failed to delete key');
    }
  };

  return {
    keys,
    logs,
    loading,
    generateKey,
    revokeKey,
    deleteKey,
    refetch: () => Promise.all([fetchKeys(), fetchLogs()]),
  };
}
