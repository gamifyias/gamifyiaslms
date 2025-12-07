-- Create topic_progress table for tracking student progress on each topic
CREATE TABLE IF NOT EXISTS topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  
  -- XP tracking
  video_xp INTEGER DEFAULT 0,
  test_xp INTEGER DEFAULT 0,
  revision_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  
  -- Completion tracking
  video_completed BOOLEAN DEFAULT FALSE,
  test_score NUMERIC DEFAULT 0,
  test_completed BOOLEAN DEFAULT FALSE,
  
  -- Revision tracking (4 revisions max)
  revision_1_completed BOOLEAN DEFAULT FALSE,
  revision_1_date TIMESTAMP,
  revision_2_completed BOOLEAN DEFAULT FALSE,
  revision_2_date TIMESTAMP,
  revision_3_completed BOOLEAN DEFAULT FALSE,
  revision_3_date TIMESTAMP,
  revision_4_completed BOOLEAN DEFAULT FALSE,
  revision_4_date TIMESTAMP,
  
  -- Status (MASTERED, GOOD, NEEDS_WORK)
  status TEXT DEFAULT 'NEEDS_WORK' CHECK (status IN ('MASTERED', 'GOOD', 'NEEDS_WORK')),
  progress_percentage INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(student_id, topic_id),
  CREATED_AT TIMESTAMP DEFAULT NOW()
);

-- Create revision_schedule table for tracking overdue revisions
CREATE TABLE IF NOT EXISTS revision_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  topic_progress_id UUID NOT NULL REFERENCES topic_progress(id) ON DELETE CASCADE,
  
  revision_number INTEGER CHECK (revision_number BETWEEN 1 AND 4),
  due_date DATE NOT NULL,
  completed_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  is_overdue BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(topic_progress_id, revision_number)
);

-- Create student_activity_feed table for activity logging
CREATE TABLE IF NOT EXISTS student_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  activity_description TEXT,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_progress
CREATE POLICY "topic_progress_select_own" ON topic_progress
  FOR SELECT USING (student_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "topic_progress_insert_own" ON topic_progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "topic_progress_update_own" ON topic_progress
  FOR UPDATE USING (student_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- RLS Policies for revision_schedule
CREATE POLICY "revision_schedule_select_own" ON revision_schedule
  FOR SELECT USING (student_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "revision_schedule_insert_own" ON revision_schedule
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "revision_schedule_update_own" ON revision_schedule
  FOR UPDATE USING (student_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- RLS Policies for student_activity_feed
CREATE POLICY "activity_feed_select_own" ON student_activity_feed
  FOR SELECT USING (student_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "activity_feed_insert_own" ON student_activity_feed
  FOR INSERT WITH CHECK (student_id = auth.uid());
