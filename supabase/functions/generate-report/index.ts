import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MedicationLog {
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

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
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

    const { period, startDate, endDate } = await req.json();

    // Fetch medications
    const { data: medications, error: medsError } = await supabaseClient
      .from('medications')
      .select('*')
      .eq('is_active', true);

    if (medsError) throw medsError;

    // Fetch logs for the period
    const { data: logs, error: logsError } = await supabaseClient
      .from('medication_logs')
      .select(`
        *,
        medication:medications(name, dosage, frequency)
      `)
      .gte('taken_at', startDate)
      .lte('taken_at', endDate)
      .order('taken_at', { ascending: false });

    if (logsError) throw logsError;

    // Calculate statistics
    const totalMedications = medications?.length || 0;
    const periodDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate expected doses
    let expectedDoses = 0;
    medications?.forEach((med: Medication) => {
      expectedDoses += (med.time_of_day?.length || 1) * periodDays;
    });

    const takenDoses = logs?.filter((log: MedicationLog) => log.status === 'taken').length || 0;
    const adherenceRate = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0;

    // Group logs by medication
    const logsByMedication: Record<string, MedicationLog[]> = {};
    logs?.forEach((log: MedicationLog) => {
      if (!logsByMedication[log.medication_id]) {
        logsByMedication[log.medication_id] = [];
      }
      logsByMedication[log.medication_id].push(log);
    });

    // Calculate per-medication adherence
    const medicationStats = medications?.map((med: Medication) => {
      const medLogs = logsByMedication[med.id] || [];
      const medExpected = (med.time_of_day?.length || 1) * periodDays;
      const medTaken = medLogs.filter((l: MedicationLog) => l.status === 'taken').length;
      return {
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        expected: medExpected,
        taken: medTaken,
        adherence: medExpected > 0 ? Math.round((medTaken / medExpected) * 100) : 0,
      };
    }) || [];

    // Prepare data summary for AI
    const dataSummary = {
      period,
      periodDays,
      startDate,
      endDate,
      totalMedications,
      expectedDoses,
      takenDoses,
      missedDoses: expectedDoses - takenDoses,
      adherenceRate,
      medicationStats,
    };

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiPrompt = `You are a friendly health assistant analyzing medication adherence data. Based on the following data, provide helpful insights and recommendations.

Data Summary:
- Period: ${period} (${periodDays} days from ${startDate} to ${endDate})
- Total medications being tracked: ${totalMedications}
- Expected doses: ${expectedDoses}
- Doses taken: ${takenDoses}
- Doses missed: ${expectedDoses - takenDoses}
- Overall adherence rate: ${adherenceRate}%

Per-medication breakdown:
${medicationStats.map((m: { name: string; dosage: string; taken: number; expected: number; adherence: number }) => 
  `- ${m.name} (${m.dosage}): ${m.taken}/${m.expected} doses taken (${m.adherence}% adherence)`
).join('\n')}

Please provide:
1. A brief summary of medication adherence for this period (2-3 sentences)
2. Key observations about patterns (e.g., any medications with notably low adherence)
3. 2-3 personalized, encouraging recommendations to improve adherence
4. A motivational note based on their performance

Keep the tone warm, supportive, and non-judgmental. Format your response in clear sections.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a compassionate health assistant helping users manage their medication schedules. Be encouraging and supportive.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('Failed to generate AI insights');
    }

    const aiData = await aiResponse.json();
    const aiInsights = aiData.choices?.[0]?.message?.content || 'Unable to generate insights at this time.';

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...dataSummary,
        logs: logs || [],
        aiInsights,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate report' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
