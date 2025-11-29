-- Create table for storing field analysis results
CREATE TABLE IF NOT EXISTS field_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  classification JSONB NOT NULL, -- Store the 6-class classification percentages
  classification_map_url TEXT NOT NULL,
  ndvi_stats JSONB,
  crop_recommendations JSONB NOT NULL,
  profitability_score INTEGER NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries by field_id
CREATE INDEX idx_field_analyses_field_id ON field_analyses(field_id);
CREATE INDEX idx_field_analyses_user_id ON field_analyses(user_id);
CREATE INDEX idx_field_analyses_created_at ON field_analyses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE field_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own analyses
CREATE POLICY "Users can view their own field analyses"
  ON field_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own analyses
CREATE POLICY "Users can insert their own field analyses"
  ON field_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create table for storing consultation bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  district TEXT NOT NULL,
  farm_size TEXT NOT NULL,
  consultation_type TEXT NOT NULL, -- 'phone', 'video', 'onsite'
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL, -- 'morning', 'afternoon', 'evening'
  crop_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_preferred_date ON bookings(preferred_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own bookings
CREATE POLICY "Users can insert their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
