-- Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'mentor', 'student');
CREATE TYPE public.exam_difficulty AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE public.question_type AS ENUM ('mcq', 'short_answer', 'essay');
CREATE TYPE public.badge_category AS ENUM ('streak', 'accuracy', 'speed', 'achievement');

-- Users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student specific data
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  board_rank INT,
  current_level INT DEFAULT 1,
  total_points INT DEFAULT 0,
  total_hours_studied INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  last_study_date DATE,
  overall_accuracy DECIMAL(5,2) DEFAULT 0,
  preferred_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mentor specific data
CREATE TABLE public.mentor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  years_of_experience INT,
  rating DECIMAL(3,2) DEFAULT 5,
  total_students INT DEFAULT 0,
  availability TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subject categories
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Topics within subjects
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Study materials/content
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT, -- 'video', 'article', 'pdf'
  resource_url TEXT,
  duration_minutes INT,
  difficulty public.exam_difficulty,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions/Quizzes
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type public.question_type DEFAULT 'mcq',
  difficulty public.exam_difficulty,
  marks INT DEFAULT 1,
  explanation TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MCQ Options
CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INT
);

-- Student answers to questions
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id),
  answer_text TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badges/Achievements
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category public.badge_category,
  requirement_text TEXT,
  points_awarded INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student badges earned
CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, badge_id)
);

-- Study sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  questions_answered INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (role = 'mentor' OR role = 'admin');
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for student_profiles
CREATE POLICY "student_profiles_select_own" ON public.student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "student_profiles_insert_own" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "student_profiles_update_own" ON public.student_profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for mentor_profiles (visible to all)
CREATE POLICY "mentor_profiles_select" ON public.mentor_profiles FOR SELECT USING (TRUE);
CREATE POLICY "mentor_profiles_insert_own" ON public.mentor_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "mentor_profiles_update_own" ON public.mentor_profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for public content tables
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT USING (TRUE);
CREATE POLICY "topics_select" ON public.topics FOR SELECT USING (TRUE);
CREATE POLICY "study_materials_select" ON public.study_materials FOR SELECT USING (TRUE);
CREATE POLICY "questions_select" ON public.questions FOR SELECT USING (TRUE);
CREATE POLICY "question_options_select" ON public.question_options FOR SELECT USING (TRUE);
CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (TRUE);

-- RLS Policies for student_answers
CREATE POLICY "student_answers_select_own" ON public.student_answers FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "student_answers_insert_own" ON public.student_answers FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RLS Policies for student_badges
CREATE POLICY "student_badges_select_own" ON public.student_badges FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "student_badges_insert_own" ON public.student_badges FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RLS Policies for study_sessions
CREATE POLICY "study_sessions_select_own" ON public.study_sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "study_sessions_insert_own" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "study_sessions_update_own" ON public.study_sessions FOR UPDATE USING (auth.uid() = student_id);

-- Trigger to create student profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
  ) ON CONFLICT (id) DO NOTHING;
  
  IF COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role) = 'student' THEN
    INSERT INTO public.student_profiles (id, profile_id)
    VALUES (new.id, new.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_user();
