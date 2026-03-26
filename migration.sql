-- 1. Create/Update Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Ensure logo_url exists if table was created earlier
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Add school_id to existing tables (with safety checks)
DO $$ 
BEGIN 
    -- Students
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
        ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;
        ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE public.students ADD COLUMN IF NOT EXISTS contact_number TEXT;
        ALTER TABLE public.students ADD COLUMN IF NOT EXISTS father_name TEXT;
    END IF;

    -- Teachers
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subject TEXT;
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
INSERT INTO schools (name, school_code, logo_url) VALUES 
('Adarsh Shishu Mandir', 'ASM01', 'https://mbuoelfmgpcexjyednui.supabase.co/storage/v1/object/public/logos/asm_logo.png'),
('Global International', 'GLOBAL02', NULL)
ON CONFLICT (school_code) DO NOTHING;

-- 7. Ensure Storage Buckets exist (logos, student-photos, avatars)
INSERT INTO storage.buckets (id, name, public) VALUES 
('logos', 'logos', true),
('student-photos', 'student-photos', true),
('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for all buckets
-- 1. Public Access (Read)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

-- 2. Authenticated Upload (Admin/Staff/User)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Authenticated Update/Delete
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

-- 6. Helper Function to get school_id from school_code (Optional for RPC)
CREATE OR REPLACE FUNCTION get_school_by_code(code TEXT)
RETURNS UUID AS $$
  SELECT id FROM schools WHERE school_code = UPPER(code) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Associate existing data with the default school (ASM01)
DO $$ 
DECLARE 
    default_school_id UUID;
BEGIN 
    -- 1. Get the ID for ASM01
    SELECT id INTO default_school_id FROM schools WHERE school_code = 'ASM01' LIMIT 1;
    
    -- 2. If it doesn't exist (unlikely), create it
    IF default_school_id IS NULL THEN
        INSERT INTO schools (name, school_code) VALUES ('Adarsh Shishu Mandir', 'ASM01') RETURNING id INTO default_school_id;
    END IF;

    -- 3. Update Students
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        UPDATE public.students SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;

    -- 4. Update Teachers
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
        UPDATE public.teachers SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;

    -- 5. Update other tables if they exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
        UPDATE public.exams SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'results') THEN
        UPDATE public.results SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
END $$;

-- 8. Profile Update Logic (RPC)
CREATE OR REPLACE FUNCTION force_update_user(
  target_id TEXT, -- Can be UUID or Int as String
  new_email TEXT,
  new_name TEXT,
  new_phone TEXT,
  new_subject TEXT,
  new_address TEXT,
  new_parent TEXT,
  new_avatar TEXT,
  table_type TEXT
) RETURNS VOID AS $$
BEGIN
  IF table_type = 'teacher' THEN
    UPDATE public.teachers SET
      full_name = new_name,
      email = new_email,
      phone = new_phone,
      subject = new_subject,
      address = new_address,
      avatar_url = new_avatar
    WHERE id::text = target_id OR email = new_email;
  ELSE
    UPDATE public.students SET
      full_name = new_name,
      email = new_email,
      contact_number = new_phone,
      address = new_address,
      father_name = new_parent,
      photo_url = new_avatar
    WHERE student_id::text = target_id OR email = new_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
