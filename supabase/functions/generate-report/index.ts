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
  medication_type: string;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
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

    // Calculate statistics - exclude one-time and as-needed medications from adherence
    const trackableMedications = medications?.filter((med: Medication) => 
      med.medication_type === 'prescription'
    ) || [];
    
    const oneTimeMedications = medications?.filter((med: Medication) => 
      med.medication_type === 'one-time'
    ) || [];
    
    const asNeededMedications = medications?.filter((med: Medication) => 
      med.medication_type === 'as-needed'
    ) || [];

    const totalMedications = medications?.length || 0;
    const periodDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate expected doses only for trackable prescriptions
    let expectedDoses = 0;
    trackableMedications.forEach((med: Medication) => {
      // Calculate days this medication was active during the period
      const medStart = med.start_date ? new Date(med.start_date) : new Date(0);
      const medEnd = med.end_date ? new Date(med.end_date) : new Date(endDate);
      const periodStart = new Date(startDate);
      const periodEnd = new Date(endDate);
      
      // Find overlap between medication period and report period
      const overlapStart = new Date(Math.max(medStart.getTime(), periodStart.getTime()));
      const overlapEnd = new Date(Math.min(medEnd.getTime(), periodEnd.getTime()));
      
      if (overlapStart <= overlapEnd) {
        const activeDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        expectedDoses += (med.time_of_day?.length || 1) * activeDays;
      }
    });

    const takenDoses = logs?.filter((log: MedicationLog) => 
      log.status === 'taken' && 
      trackableMedications.some((med: Medication) => med.id === log.medication_id)
    ).length || 0;
    
    const adherenceRate = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0;

    // Group logs by medication
    const logsByMedication: Record<string, MedicationLog[]> = {};
    logs?.forEach((log: MedicationLog) => {
      if (!logsByMedication[log.medication_id]) {
        logsByMedication[log.medication_id] = [];
      }
      logsByMedication[log.medication_id].push(log);
    });

    // Calculate per-medication adherence (only for prescriptions)
    const medicationStats = trackableMedications.map((med: Medication) => {
      const medLogs = logsByMedication[med.id] || [];
      
      // Calculate active days for this medication
      const medStart = med.start_date ? new Date(med.start_date) : new Date(0);
      const medEnd = med.end_date ? new Date(med.end_date) : new Date(endDate);
      const periodStart = new Date(startDate);
      const periodEnd = new Date(endDate);
      
      const overlapStart = new Date(Math.max(medStart.getTime(), periodStart.getTime()));
      const overlapEnd = new Date(Math.min(medEnd.getTime(), periodEnd.getTime()));
      
      let medExpected = 0;
      if (overlapStart <= overlapEnd) {
        const activeDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        medExpected = (med.time_of_day?.length || 1) * activeDays;
      }
      
      const medTaken = medLogs.filter((l: MedicationLog) => l.status === 'taken').length;
      return {
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        type: 'prescription',
        expected: medExpected,
        taken: medTaken,
        adherence: medExpected > 0 ? Math.round((medTaken / medExpected) * 100) : 0,
        durationDays: med.duration_days,
        startDate: med.start_date,
        endDate: med.end_date,
      };
    }) || [];

    // Add one-time medications to stats (not counted in adherence)
    const oneTimeStats = oneTimeMedications.map((med: Medication) => {
      const medLogs = logsByMedication[med.id] || [];
      return {
        name: med.name,
        dosage: med.dosage,
        frequency: 'One-time',
        type: 'one-time',
        expected: 1,
        taken: medLogs.filter((l: MedicationLog) => l.status === 'taken').length,
        adherence: null, // Not applicable for one-time
        durationDays: 1,
        startDate: med.start_date,
        endDate: med.end_date,
      };
    });

    // Add as-needed medications to stats (not counted in adherence)
    const asNeededStats = asNeededMedications.map((med: Medication) => {
      const medLogs = logsByMedication[med.id] || [];
      return {
        name: med.name,
        dosage: med.dosage,
        frequency: 'As needed',
        type: 'as-needed',
        expected: null,
        taken: medLogs.filter((l: MedicationLog) => l.status === 'taken').length,
        adherence: null, // Not applicable for as-needed
        durationDays: null,
        startDate: med.start_date,
        endDate: med.end_date,
      };
    });

    const allMedicationStats = [...medicationStats, ...oneTimeStats, ...asNeededStats];

    // Prepare data summary for AI
    const dataSummary = {
      period,
      periodDays,
      startDate,
      endDate,
      totalMedications,
      prescriptionCount: trackableMedications.length,
      oneTimeCount: oneTimeMedications.length,
      asNeededCount: asNeededMedications.length,
      expectedDoses,
      takenDoses,
      missedDoses: expectedDoses - takenDoses,
      adherenceRate,
      medicationStats: allMedicationStats,
    };

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Format medication stats for AI prompt
    const prescriptionBreakdown = medicationStats.map((m: { name: string; dosage: string; taken: number; expected: number; adherence: number }) => 
      `- ${m.name} (${m.dosage}): ${m.taken}/${m.expected} doses taken (${m.adherence}% adherence)`
    ).join('\n');

    const oneTimeBreakdown = oneTimeStats.length > 0 
      ? '\n\nOne-time medications taken:\n' + oneTimeStats.map((m: { name: string; dosage: string; taken: number }) => 
          `- ${m.name} (${m.dosage}): Taken ${m.taken} time(s)`
        ).join('\n')
      : '';

    const asNeededBreakdown = asNeededStats.length > 0 
      ? '\n\nAs-needed medications:\n' + asNeededStats.map((m: { name: string; dosage: string; taken: number }) => 
          `- ${m.name} (${m.dosage}): Taken ${m.taken} time(s) during this period`
        ).join('\n')
      : '';

    const aiPrompt = `You are a friendly health assistant analyzing medication adherence data. Based on the following data, provide helpful insights and recommendations.

Data Summary:
- Period: ${period} (${periodDays} days from ${startDate} to ${endDate})
- Total medications: ${totalMedications} (${trackableMedications.length} prescriptions, ${oneTimeMedications.length} one-time, ${asNeededMedications.length} as-needed)
- Prescription adherence is calculated only for regular prescriptions, not one-time or as-needed medications.
- Expected prescription doses: ${expectedDoses}
- Prescription doses taken: ${takenDoses}
- Prescription doses missed: ${expectedDoses - takenDoses}
- Overall prescription adherence rate: ${adherenceRate}%

Prescription medication breakdown:
${prescriptionBreakdown || 'No prescriptions during this period'}
${oneTimeBreakdown}
${asNeededBreakdown}

IMPORTANT FORMATTING RULES:
- Do NOT use any markdown formatting like **, ***, ##, ###, or bullet points with -
- Write in plain text with clear paragraph breaks
- Use simple numbered lists (1. 2. 3.) when listing items
- Separate sections with a blank line

Please provide the following in plain text format:

SUMMARY
Write 2-3 sentences summarizing medication adherence for this period.

KEY OBSERVATIONS  
Describe patterns you notice, such as medications with notably low adherence or consistent performance.

RECOMMENDATIONS
Provide 2-3 personalized, encouraging recommendations to improve adherence. Number them 1, 2, 3.

ENCOURAGEMENT
End with a warm, motivational note based on their performance.

Keep the tone warm, supportive, and non-judgmental.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a compassionate health assistant helping users manage their medication schedules. Be encouraging and supportive. NEVER use markdown formatting like **, ***, ##, or ### in your responses. Write in plain, clean text only.' },
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
