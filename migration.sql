-- 1. Create Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Add school_id to existing tables (with safety checks)
DO $$ 
BEGIN 
    -- Students
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Teachers
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Exams
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
        ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Results
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'results') THEN
        ALTER TABLE public.results ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Attendance
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Fees
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fees') THEN
        ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Homework
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'homework') THEN
        ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;

    -- Notices
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notices') THEN
        ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
    END IF;
END $$;

-- 3. Enabling RLS on Core Tables (with safety checks)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
        ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
        ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'results') THEN
        ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Creating RLS Policies (Isolation Logic - SAFE VERSION)
DO $$ 
BEGIN 
    -- Students Policy
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        DROP POLICY IF EXISTS "School Isolation Policy" ON students;
        CREATE POLICY "School Isolation Policy" ON students FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);
    END IF;

    -- Teachers Policy
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
        DROP POLICY IF EXISTS "School Isolation Policy" ON teachers;
        CREATE POLICY "School Isolation Policy" ON teachers FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);
    END IF;

    -- Exams Policy
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
        DROP POLICY IF EXISTS "School Isolation Policy" ON exams;
        CREATE POLICY "School Isolation Policy" ON exams FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);
    END IF;

    -- Results Policy
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'results') THEN
        DROP POLICY IF EXISTS "School Isolation Policy" ON results;
        CREATE POLICY "School Isolation Policy" ON results FOR ALL USING (school_id = (auth.jwt() ->> 'school_id')::uuid);
    END IF;
END $$;

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
