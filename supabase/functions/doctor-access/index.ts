import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash the key using SHA-256
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for accessing cross-user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate the doctor's session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has doctor role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'doctor')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Only doctors can access patient reports' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { accessKey, period } = await req.json();

    if (!accessKey) {
      return new Response(JSON.stringify({ error: 'Access key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hash the provided key and look it up
    const keyHash = await hashKey(accessKey);

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('access_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('status', 'active')
      .single();

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'Invalid or revoked access key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const patientUserId = keyData.user_id;

    // Update key usage stats
    await supabaseAdmin
      .from('access_keys')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: keyData.use_count + 1,
      })
      .eq('id', keyData.id);

    // Log the access
    const clientInfo = req.headers.get('x-client-info') || '';
    const userAgent = req.headers.get('user-agent') || '';

    await supabaseAdmin
      .from('report_access_logs')
      .insert({
        access_key_id: keyData.id,
        patient_user_id: patientUserId,
        doctor_user_id: user.id,
        report_type: period || 'weekly',
        user_agent: userAgent,
      });

    // Fetch patient's medications
    const { data: medications, error: medsError } = await supabaseAdmin
      .from('medications')
      .select('*')
      .eq('user_id', patientUserId)
      .eq('is_active', true);

    if (medsError) throw medsError;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch medication logs
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('medication_logs')
      .select(`
        *,
        medication:medications(name, dosage, frequency, color)
      `)
      .eq('user_id', patientUserId)
      .gte('taken_at', startDate.toISOString())
      .lte('taken_at', endDate.toISOString())
      .order('taken_at', { ascending: false });

    if (logsError) throw logsError;

    // Get patient profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', patientUserId)
      .single();

    // Calculate adherence stats (simplified version)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const trackableMedications = medications?.filter(m => m.medication_type === 'prescription') || [];
    
    let expectedDoses = 0;
    trackableMedications.forEach((med) => {
      expectedDoses += (med.time_of_day?.length || 1) * periodDays;
    });

    const takenDoses = logs?.filter(log => 
      log.status === 'taken' && 
      trackableMedications.some(med => med.id === log.medication_id)
    ).length || 0;

    const adherenceRate = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0;

    return new Response(JSON.stringify({
      success: true,
      data: {
        patient: {
          name: profile?.full_name || 'Patient',
        },
        period,
        periodDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalMedications: medications?.length || 0,
        expectedDoses,
        takenDoses,
        adherenceRate,
        medications: medications?.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          type: m.medication_type,
        })) || [],
        logs: logs?.map(l => ({
          id: l.id,
          medication_name: l.medication?.name,
          dosage: l.medication?.dosage,
          taken_at: l.taken_at,
          scheduled_time: l.scheduled_time,
          status: l.status,
        })) || [],
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Doctor access error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to access report' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
