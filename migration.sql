-- 1. Create Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Add school_id to existing tables
DO $$ 
BEGIN 
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.results ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
END $$;

-- 3. Enabling RLS on Core Tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 4. Creating RLS Policies (Isolation Logic)
-- Students can only see their own school's data
CREATE POLICY "School Isolation Policy" ON students
FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);

CREATE POLICY "School Isolation Policy" ON teachers
FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);

CREATE POLICY "School Isolation Policy" ON exams
FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);

CREATE POLICY "School Isolation Policy" ON results
FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);

-- 5. Insert Sample Schools for Testing
INSERT INTO schools (name, school_code) VALUES 
('Adarsh Shishu Mandir', 'ASM01'),
('Global International', 'GLOBAL02');

-- 6. Helper Function to get school_id from school_code (Optional for RPC)
CREATE OR REPLACE FUNCTION get_school_by_code(code TEXT)
RETURNS UUID AS $$
  SELECT id FROM schools WHERE school_code = UPPER(code) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Insert default school (Optional, for existing data)
-- INSERT INTO public.schools (name, school_code) VALUES ('Default School', 'DEFAULT');
-- UPDATE public.students SET school_id = (SELECT id FROM public.schools WHERE school_code = 'DEFAULT') WHERE school_id IS NULL;
