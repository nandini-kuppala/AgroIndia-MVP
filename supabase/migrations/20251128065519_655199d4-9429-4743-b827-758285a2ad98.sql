-- Create fields table
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  coordinates TEXT,
  area DECIMAL NOT NULL,
  area_unit TEXT NOT NULL DEFAULT 'acres',
  soil_type TEXT NOT NULL,
  water_source TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  planting_date DATE NOT NULL,
  expected_harvest_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- Create policies for fields
CREATE POLICY "Users can view their own fields"
  ON public.fields
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fields"
  ON public.fields
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fields"
  ON public.fields
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fields"
  ON public.fields
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fields_timestamp
  BEFORE UPDATE ON public.fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fields_updated_at();