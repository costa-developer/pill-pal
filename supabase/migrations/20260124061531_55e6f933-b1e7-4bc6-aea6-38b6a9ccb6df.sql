-- Add medication type and period columns to medications table
ALTER TABLE public.medications 
ADD COLUMN medication_type text NOT NULL DEFAULT 'prescription',
ADD COLUMN duration_days integer DEFAULT NULL,
ADD COLUMN start_date timestamp with time zone DEFAULT now(),
ADD COLUMN end_date timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.medications.medication_type IS 'Type: one-time, prescription, or as-needed';
COMMENT ON COLUMN public.medications.duration_days IS 'Duration in days for prescriptions (NULL = ongoing)';
COMMENT ON COLUMN public.medications.start_date IS 'When the medication course started';
COMMENT ON COLUMN public.medications.end_date IS 'When the medication course ends (NULL = ongoing)';