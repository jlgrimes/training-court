-- Create decks table
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('Standard', 'Expanded')),
    list JSONB NOT NULL DEFAULT '{}',
    pokemon_count INTEGER NOT NULL DEFAULT 0,
    trainer_count INTEGER NOT NULL DEFAULT 0,
    energy_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_decks_user_id ON public.decks(user_id);
CREATE INDEX idx_decks_is_active ON public.decks(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own decks" ON public.decks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks" ON public.decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks" ON public.decks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks" ON public.decks
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON public.decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure only one active deck per user
CREATE UNIQUE INDEX unique_active_deck_per_user ON public.decks(user_id) WHERE is_active = true;