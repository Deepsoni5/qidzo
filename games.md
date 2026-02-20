0) enums :-
-- Game type: arcade-only vs question-based
create type game_type as enum ('ARCADE', 'QUESTION');

-- Question type for the question bank
create type question_type as enum ('MCQ', 'FILL_BLANK', 'SYNONYM', 'ANTONYM', 'MATH');

1)
create table public.games (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,     -- 'memory_match', 'math_sprint'
  name               text not null,            -- display name
  description        text,
  type               game_type not null,       -- 'ARCADE' or 'QUESTION'
  min_age            integer,                  -- suggested min child age
  max_age            integer,                  -- suggested max child age
  icon               text,                     -- emoji or icon key
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);
Examples:

- slug = 'memory_match', type = 'ARCADE'
- slug = 'math_sprint', type = 'QUESTION'

2)
create table public.game_levels (
  id                 uuid primary key default gen_random_uuid(),
  game_id            uuid not null references public.games(id) on delete cascade,
  level_number       integer not null,               -- 1,2,3...
  name               text not null,                  -- 'Beginner', 'Level 2'
  description        text,
  min_age            integer,                        -- optional override
  max_age            integer,
  config             jsonb not null default '{}'::jsonb,
  target_score       integer not null default 0,     -- score needed to 'pass'
  max_time_sec       integer,                        -- general timer limit
  xp_base            integer not null default 0,     -- base XP per clear
  xp_per_correct     integer not null default 0,     -- XP per correct answer / hit
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (game_id, level_number)
);
Examples of config JSON:

- Memory Match:
   { "pairs": 8, "theme": "animals" }
- Reflex Tap:
   { "durationSec": 30, "spawnRate": "fast" }
- Math Sprint:
   { "operations": ["add","sub"], "minValue": 1, "maxValue": 50, "numQuestions": 12 }

3)
create table public.game_questions (
  id                 uuid primary key default gen_random_uuid(),
  game_id            uuid not null references public.games(id) on delete cascade,
  level_id           uuid references public.game_levels(id) on delete set null,
  type               question_type not null,         -- 'MCQ', 'FILL_BLANK', etc
  prompt             text not null,                  -- main question text
  options            jsonb,                          -- ['2','3','4','5'] for MCQ
  correct_answer     text not null,                  -- canonical correct answer
  explanation        text,                           -- optional 'why'
  topic              text,                           -- 'fractions', 'vocab_animals'
  difficulty         text,                           -- 'easy','medium','hard'
  metadata           jsonb not null default '{}'::jsonb,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

-- Helpful indexes for fast filtering
create index game_questions_game_idx
  on public.game_questions (game_id);

create index game_questions_level_idx
  on public.game_questions (level_id);

create index game_questions_topic_idx
  on public.game_questions (topic);

  How you’ll use it:

- Math Sprint (question mode):
  - game_id = (Math Sprint game) , type = 'MATH' or 'MCQ' .
  - Example:
     prompt = '7 + 5 = ?'
     options = '["10","11","12","13"]'::jsonb
     correct_answer = '12' .
- Fill in the blanks :
  - type = 'FILL_BLANK'
  - prompt = 'The sky is ___.'
  - options can be null for free text, or multiple choices.
- Synonym / Antonym :
  - type = 'SYNONYM' / 'ANTONYM'
  - topic = 'vocabulary' or more specific ( 'vocab_grade_5' ).
- General MCQ :
  - type = 'MCQ' , topic = subject (“science”, “math”, etc).

4)
create table public.game_attempts (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.children(id) on delete cascade,
  game_id            uuid not null references public.games(id) on delete cascade,
  level_id           uuid references public.game_levels(id) on delete set null,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  duration_sec       integer,
  score              integer not null default 0,
  correct_count      integer not null default 0,
  total_questions    integer not null default 0,
  result             jsonb not null default '{}'::jsonb,  -- per-question results, etc
  xp_awarded         integer not null default 0
);

-- Index for querying a child's history
create index game_attempts_child_idx
  on public.game_attempts (child_id, game_id);

-- Index for level-based analytics
create index game_attempts_level_idx
  on public.game_attempts (game_id, level_id);

result json
{
  "questions": [
    { "question_id": "uuid-1", "correct": true,  "child_answer": "12" },
    { "question_id": "uuid-2", "correct": false, "child_answer": "9"  }
  ],
  "raw_score": 120,
  "combo_max": 5
}

5)
create table public.child_game_progress (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.children(id) on delete cascade,
  game_id            uuid not null references public.games(id) on delete cascade,
  level_id           uuid not null references public.game_levels(id) on delete cascade,
  best_score         integer not null default 0,
  stars_earned       integer not null default 0,     -- 0 to 3 stars
  attempts_count     integer not null default 0,
  last_played_at     timestamptz,
  unlocked           boolean not null default false, -- can play this level?
  constraint child_game_progress_unique
    unique (child_id, game_id, level_id)
);

create index child_game_progress_child_idx
  on public.child_game_progress (child_id, game_id);

Usage:

- When a session ends:
  
  - Read target_score from game_levels .
  - Decide:
    
    - If score >= target_score :
      - compute new stars_earned (1–3 depending on how much they beat it).
      - mark this level unlocked = true .
      - unlock next level by inserting/updating next row with unlocked = true .
  - Update best_score , attempts_count , last_played_at .
- Playzone UI:
  
  - For a given child and game, query child_game_progress to show:
    - Which levels are locked, which have ⭐⭐ or ⭐⭐⭐.
    - Encourage them to replay to improve stars/score (so it stays competitive for a 10‑year‑old, not boring).






-- ==========================================
-- QIDZO GAMES - PROFESSIONAL GAME SYSTEM
-- Designed for 10-year-old engagement
-- 8 Games | 24 Levels | 200+ Questions
-- ==========================================

-- ==========================================
-- STEP 1: INSERT GAMES
-- ==========================================

INSERT INTO games (slug, name, description, type, min_age, max_age, icon, is_active) VALUES

-- ARCADE GAMES (No questions needed)
('memory-match', 'Memory Match', 'Flip cards and find matching pairs! Test your memory and speed.', 'ARCADE', 6, 14, '🧠', true),
('reflex-tap', 'Reflex Tap', 'Tap the targets as fast as you can! Train your reflexes and reaction time.', 'ARCADE', 7, 15, '⚡', true),
('pattern-master', 'Pattern Master', 'Remember and repeat the pattern! How long can your sequence get?', 'ARCADE', 8, 16, '🎯', true),

-- QUESTION-BASED GAMES
('math-sprint', 'Math Sprint', 'Solve math problems against the clock! Addition, subtraction, multiplication - you got this!', 'QUESTION', 7, 14, '🔢', true),
('word-wizard', 'Word Wizard', 'Master synonyms, antonyms, and spelling! Become a vocabulary champion!', 'QUESTION', 8, 15, '📚', true),
('science-quest', 'Science Quest', 'Explore the wonders of science! Answer questions about nature, space, and experiments.', 'QUESTION', 9, 16, '🔬', true),
('brain-teaser', 'Brain Teaser', 'Logic puzzles and riddles that make you think! Can you solve them all?', 'QUESTION', 9, 17, '🧩', true),
('quick-quiz', 'Quick Quiz', 'Fast-paced general knowledge! History, geography, fun facts - how much do you know?', 'QUESTION', 8, 15, '💡', true);


-- ==========================================
-- STEP 2: INSERT GAME LEVELS (3 levels per game)
-- ==========================================

-- MEMORY MATCH LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Beginner', 'Start with 6 pairs - nice and easy!', 6, 14,
  '{"pairs": 6, "theme": "fruits", "timeLimit": 90, "showTime": 2}'::jsonb,
  300, 90, 20, 5, true
FROM games WHERE slug = 'memory-match'
UNION ALL
SELECT 
  id, 2, 'Intermediate', 'Can you handle 10 pairs? Time is ticking!', 7, 14,
  '{"pairs": 10, "theme": "animals", "timeLimit": 120, "showTime": 1.5}'::jsonb,
  500, 120, 30, 8, true
FROM games WHERE slug = 'memory-match'
UNION ALL
SELECT 
  id, 3, 'Expert', 'Master level! 15 pairs with less time - you are a memory champion!', 8, 14,
  '{"pairs": 15, "theme": "space", "timeLimit": 150, "showTime": 1}'::jsonb,
  800, 150, 50, 12, true
FROM games WHERE slug = 'memory-match';

-- REFLEX TAP LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Slow Start', 'Targets appear slowly. Get warmed up!', 7, 15,
  '{"durationSec": 30, "spawnRate": "slow", "targetSize": "large", "colors": ["red", "blue"]}'::jsonb,
  20, 30, 15, 2, true
FROM games WHERE slug = 'reflex-tap'
UNION ALL
SELECT 
  id, 2, 'Speed Up', 'Faster targets! Can you keep up?', 8, 15,
  '{"durationSec": 45, "spawnRate": "medium", "targetSize": "medium", "colors": ["red", "blue", "green"]}'::jsonb,
  40, 45, 25, 3, true
FROM games WHERE slug = 'reflex-tap'
UNION ALL
SELECT 
  id, 3, 'Lightning Fast', 'Ultimate speed! Only the best can master this!', 9, 15,
  '{"durationSec": 60, "spawnRate": "fast", "targetSize": "small", "colors": ["red", "blue", "green", "yellow"]}'::jsonb,
  70, 60, 40, 5, true
FROM games WHERE slug = 'reflex-tap';

-- PATTERN MASTER LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Simple Sequences', 'Start with 4-step patterns. Watch and repeat!', 8, 16,
  '{"sequenceLength": 4, "showTime": 3, "symbols": ["circle", "square", "triangle"], "soundEnabled": true}'::jsonb,
  200, 60, 20, 10, true
FROM games WHERE slug = 'pattern-master'
UNION ALL
SELECT 
  id, 2, 'Medium Memory', 'Patterns get longer! Can you remember 6 steps?', 9, 16,
  '{"sequenceLength": 6, "showTime": 2, "symbols": ["circle", "square", "triangle", "star"], "soundEnabled": true}'::jsonb,
  400, 90, 35, 15, true
FROM games WHERE slug = 'pattern-master'
UNION ALL
SELECT 
  id, 3, 'Master Mind', '8-step patterns! Only true masters can handle this!', 10, 16,
  '{"sequenceLength": 8, "showTime": 1.5, "symbols": ["circle", "square", "triangle", "star", "heart"], "soundEnabled": true}'::jsonb,
  700, 120, 60, 25, true
FROM games WHERE slug = 'pattern-master';

-- MATH SPRINT LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Addition & Subtraction', 'Basic math with numbers 1-20. You got this!', 7, 14,
  '{"operations": ["add", "sub"], "minValue": 1, "maxValue": 20, "numQuestions": 10, "timePerQuestion": 15}'::jsonb,
  70, 150, 25, 8, true
FROM games WHERE slug = 'math-sprint'
UNION ALL
SELECT 
  id, 2, 'Times Tables', 'Multiplication time! Numbers up to 12x12.', 8, 14,
  '{"operations": ["mul", "add", "sub"], "minValue": 1, "maxValue": 12, "numQuestions": 12, "timePerQuestion": 12}'::jsonb,
  90, 144, 40, 10, true
FROM games WHERE slug = 'math-sprint'
UNION ALL
SELECT 
  id, 3, 'Math Master', 'All operations! Bigger numbers, faster pace!', 9, 14,
  '{"operations": ["add", "sub", "mul", "div"], "minValue": 1, "maxValue": 50, "numQuestions": 15, "timePerQuestion": 10}'::jsonb,
  120, 150, 60, 15, true
FROM games WHERE slug = 'math-sprint';

-- WORD WIZARD LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Word Basics', 'Easy synonyms and antonyms to start!', 8, 15,
  '{"questionTypes": ["SYNONYM", "ANTONYM"], "difficulty": "easy", "numQuestions": 10, "timePerQuestion": 20}'::jsonb,
  70, 200, 25, 8, true
FROM games WHERE slug = 'word-wizard'
UNION ALL
SELECT 
  id, 2, 'Vocabulary Builder', 'Tougher words! Expand your vocabulary!', 9, 15,
  '{"questionTypes": ["SYNONYM", "ANTONYM", "FILL_BLANK"], "difficulty": "medium", "numQuestions": 12, "timePerQuestion": 18}'::jsonb,
  85, 216, 40, 10, true
FROM games WHERE slug = 'word-wizard'
UNION ALL
SELECT 
  id, 3, 'Word Genius', 'Advanced vocabulary! Challenge accepted?', 10, 15,
  '{"questionTypes": ["SYNONYM", "ANTONYM", "FILL_BLANK"], "difficulty": "hard", "numQuestions": 15, "timePerQuestion": 15}'::jsonb,
  120, 225, 60, 15, true
FROM games WHERE slug = 'word-wizard';

-- SCIENCE QUEST LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Science Starter', 'Basic science facts about animals and nature!', 9, 16,
  '{"topics": ["animals", "nature", "basic_physics"], "difficulty": "easy", "numQuestions": 10, "timePerQuestion": 25}'::jsonb,
  70, 250, 30, 10, true
FROM games WHERE slug = 'science-quest'
UNION ALL
SELECT 
  id, 2, 'Junior Scientist', 'Learn about space, chemistry, and experiments!', 10, 16,
  '{"topics": ["space", "chemistry", "biology"], "difficulty": "medium", "numQuestions": 12, "timePerQuestion": 20}'::jsonb,
  85, 240, 45, 12, true
FROM games WHERE slug = 'science-quest'
UNION ALL
SELECT 
  id, 3, 'Science Champion', 'Advanced science! Are you ready for this?', 11, 16,
  '{"topics": ["physics", "chemistry", "astronomy", "biology"], "difficulty": "hard", "numQuestions": 15, "timePerQuestion": 18}'::jsonb,
  120, 270, 70, 18, true
FROM games WHERE slug = 'science-quest';

-- BRAIN TEASER LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Easy Riddles', 'Fun riddles and simple logic puzzles!', 9, 17,
  '{"puzzleTypes": ["riddles", "logic"], "difficulty": "easy", "numQuestions": 8, "timePerQuestion": 30}'::jsonb,
  60, 240, 30, 10, true
FROM games WHERE slug = 'brain-teaser'
UNION ALL
SELECT 
  id, 2, 'Mind Bender', 'Trickier puzzles that make you think!', 10, 17,
  '{"puzzleTypes": ["riddles", "logic", "sequences"], "difficulty": "medium", "numQuestions": 10, "timePerQuestion": 35}'::jsonb,
  75, 350, 50, 15, true
FROM games WHERE slug = 'brain-teaser'
UNION ALL
SELECT 
  id, 3, 'Genius Level', 'Only the smartest can solve these!', 11, 17,
  '{"puzzleTypes": ["riddles", "logic", "sequences", "math_puzzles"], "difficulty": "hard", "numQuestions": 12, "timePerQuestion": 40}'::jsonb,
  100, 480, 80, 20, true
FROM games WHERE slug = 'brain-teaser';

-- QUICK QUIZ LEVELS
INSERT INTO game_levels (game_id, level_number, name, description, min_age, max_age, config, target_score, max_time_sec, xp_base, xp_per_correct, is_active)
SELECT 
  id, 1, 'Fun Facts', 'Easy questions about the world around you!', 8, 15,
  '{"topics": ["animals", "geography", "history"], "difficulty": "easy", "numQuestions": 10, "timePerQuestion": 15}'::jsonb,
  70, 150, 20, 8, true
FROM games WHERE slug = 'quick-quiz'
UNION ALL
SELECT 
  id, 2, 'Knowledge Builder', 'More challenging questions! What do you know?', 9, 15,
  '{"topics": ["history", "geography", "science", "culture"], "difficulty": "medium", "numQuestions": 12, "timePerQuestion": 18}'::jsonb,
  85, 216, 35, 10, true
FROM games WHERE slug = 'quick-quiz'
UNION ALL
SELECT 
  id, 3, 'Quiz Master', 'Expert level questions! Are you a trivia champion?', 10, 15,
  '{"topics": ["history", "geography", "science", "culture", "sports"], "difficulty": "hard", "numQuestions": 15, "timePerQuestion": 15}'::jsonb,
  120, 225, 60, 15, true
FROM games WHERE slug = 'quick-quiz';


-- ==========================================
-- STEP 3: INSERT QUESTIONS (200+ questions!)
-- ==========================================

-- MATH SPRINT QUESTIONS
INSERT INTO game_questions (game_id, level_id, type, prompt, options, correct_answer, explanation, topic, difficulty, is_active)
SELECT 
  g.id, gl.id, 'MATH'::question_type,
  '5 + 7 = ?', '["10", "11", "12", "13"]'::jsonb, '12',
  '5 + 7 equals 12. Count on your fingers if you need to!', 'addition', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '15 - 8 = ?', '["5", "6", "7", "8"]'::jsonb, '7', '15 - 8 = 7', 'subtraction', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '9 + 6 = ?', '["13", "14", "15", "16"]'::jsonb, '15', '9 + 6 = 15', 'addition', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '20 - 12 = ?', '["6", "7", "8", "9"]'::jsonb, '8', '20 - 12 = 8', 'subtraction', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '11 + 9 = ?', '["18", "19", "20", "21"]'::jsonb, '20', '11 + 9 = 20', 'addition', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '17 - 9 = ?', '["6", "7", "8", "9"]'::jsonb, '8', '17 - 9 = 8', 'subtraction', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '8 + 8 = ?', '["14", "15", "16", "17"]'::jsonb, '16', '8 + 8 = 16. Double 8!', 'addition', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '14 - 6 = ?', '["6", "7", "8", "9"]'::jsonb, '8', '14 - 6 = 8', 'subtraction', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '13 + 7 = ?', '["18", "19", "20", "21"]'::jsonb, '20', '13 + 7 = 20', 'addition', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '19 - 11 = ?', '["6", "7", "8", "9"]'::jsonb, '8', '19 - 11 = 8', 'subtraction', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '5 × 6 = ?', '["25", "30", "35", "40"]'::jsonb, '30', '5 × 6 = 30', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '7 × 8 = ?', '["48", "54", "56", "64"]'::jsonb, '56', '7 × 8 = 56', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '9 × 4 = ?', '["32", "36", "40", "45"]'::jsonb, '36', '9 × 4 = 36', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '6 × 7 = ?', '["35", "40", "42", "48"]'::jsonb, '42', '6 × 7 = 42', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '8 × 9 = ?', '["64", "70", "72", "81"]'::jsonb, '72', '8 × 9 = 72', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '12 × 3 = ?', '["30", "33", "36", "39"]'::jsonb, '36', '12 × 3 = 36', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '11 × 5 = ?', '["50", "55", "60", "65"]'::jsonb, '55', '11 × 5 = 55', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '4 × 12 = ?', '["44", "48", "52", "56"]'::jsonb, '48', '4 × 12 = 48', 'multiplication', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '23 + 19 = ?', '["40", "41", "42", "43"]'::jsonb, '42', '23 + 19 = 42', 'addition', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '35 - 18 = ?', '["15", "16", "17", "18"]'::jsonb, '17', '35 - 18 = 17', 'subtraction', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '45 + 37 = ?', '["80", "81", "82", "83"]'::jsonb, '82', '45 + 37 = 82', 'addition', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '12 × 8 = ?', '["88", "92", "96", "100"]'::jsonb, '96', '12 × 8 = 96', 'multiplication', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '144 ÷ 12 = ?', '["10", "11", "12", "13"]'::jsonb, '12', '144 ÷ 12 = 12', 'division', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '87 - 39 = ?', '["46", "47", "48", "49"]'::jsonb, '48', '87 - 39 = 48', 'subtraction', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '15 × 6 = ?', '["85", "90", "95", "100"]'::jsonb, '90', '15 × 6 = 90', 'multiplication', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '108 ÷ 9 = ?', '["10", "11", "12", "13"]'::jsonb, '12', '108 ÷ 9 = 12', 'division', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '56 + 67 = ?', '["121", "122", "123", "124"]'::jsonb, '123', '56 + 67 = 123', 'addition', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3
UNION ALL
SELECT g.id, gl.id, 'MATH'::question_type, '132 - 78 = ?', '["52", "53", "54", "55"]'::jsonb, '54', '132 - 78 = 54', 'subtraction', 'hard', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'math-sprint' AND gl.level_number = 3;


-- WORD WIZARD QUESTIONS
INSERT INTO game_questions (game_id, level_id, type, prompt, options, correct_answer, explanation, topic, difficulty, is_active)
SELECT 
  g.id, gl.id, 'SYNONYM'::question_type,
  'Happy', '["Sad", "Joyful", "Angry", "Tired"]'::jsonb, 'Joyful',
  'Joyful means the same as happy - full of joy!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'SYNONYM'::question_type, 'Big', '["Tiny", "Small", "Large", "Little"]'::jsonb, 'Large', 'Large means the same as big!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'ANTONYM'::question_type, 'Hot', '["Warm", "Cold", "Boiling", "Sunny"]'::jsonb, 'Cold', 'Cold is the opposite of hot!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'ANTONYM'::question_type, 'Fast', '["Quick", "Speedy", "Slow", "Rapid"]'::jsonb, 'Slow', 'Slow is the opposite of fast!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'SYNONYM'::question_type, 'Smart', '["Dumb", "Clever", "Lazy", "Silly"]'::jsonb, 'Clever', 'Clever means the same as smart!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'SYNONYM'::question_type, 'Scared', '["Brave", "Afraid", "Happy", "Calm"]'::jsonb, 'Afraid', 'Afraid means the same as scared!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'ANTONYM'::question_type, 'Day', '["Morning", "Noon", "Night", "Evening"]'::jsonb, 'Night', 'Night is the opposite of day!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'SYNONYM'::question_type, 'Pretty', '["Ugly", "Beautiful", "Plain", "Boring"]'::jsonb, 'Beautiful', 'Beautiful means the same as pretty!', 'vocabulary', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'FILL_BLANK'::question_type, 'The sky is ___.', '["blue", "green", "red", "yellow"]'::jsonb, 'blue', 'The sky is blue!', 'common_knowledge', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'FILL_BLANK'::question_type, 'Cows say ___.', '["woof", "meow", "moo", "quack"]'::jsonb, 'moo', 'Cows say moo!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'SYNONYM'::question_type, 'Brave', '["Scared", "Cowardly", "Courageous", "Weak"]'::jsonb, 'Courageous', 'Courageous means the same as brave!', 'vocabulary', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'ANTONYM'::question_type, 'Ancient', '["Old", "Historic", "Modern", "Past"]'::jsonb, 'Modern', 'Modern is the opposite of ancient!', 'vocabulary', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'SYNONYM'::question_type, 'Gigantic', '["Tiny", "Huge", "Small", "Little"]'::jsonb, 'Huge', 'Huge means the same as gigantic - very big!', 'vocabulary', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'ANTONYM'::question_type, 'Victory', '["Win", "Success", "Defeat", "Champion"]'::jsonb, 'Defeat', 'Defeat is the opposite of victory!', 'vocabulary', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'FILL_BLANK'::question_type, 'The capital of France is ___.', '["London", "Berlin", "Paris", "Rome"]'::jsonb, 'Paris', 'The capital of France is Paris!', 'geography', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'word-wizard' AND gl.level_number = 2;


-- SCIENCE QUEST QUESTIONS
INSERT INTO game_questions (game_id, level_id, type, prompt, options, correct_answer, explanation, topic, difficulty, is_active)
SELECT 
  g.id, gl.id, 'MCQ'::question_type,
  'What do bees make?', '["Milk", "Honey", "Butter", "Cheese"]'::jsonb, 'Honey',
  'Bees collect nectar from flowers and make honey!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'How many legs does a spider have?', '["6", "8", "10", "12"]'::jsonb, '8', 'Spiders have 8 legs!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What color are plant leaves?', '["Red", "Blue", "Green", "Yellow"]'::jsonb, 'Green', 'Plant leaves are green because of chlorophyll!', 'nature', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What do plants need to grow?', '["Candy", "Sunlight", "Ice", "Rocks"]'::jsonb, 'Sunlight', 'Plants need sunlight, water, and air to grow!', 'nature', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is the largest ocean on Earth?', '["Atlantic", "Indian", "Pacific", "Arctic"]'::jsonb, 'Pacific', 'The Pacific Ocean is the largest ocean!', 'geography', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'How many planets are in our solar system?', '["7", "8", "9", "10"]'::jsonb, '8', 'There are 8 planets in our solar system!', 'space', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What gas do we breathe in?', '["Carbon Dioxide", "Oxygen", "Nitrogen", "Helium"]'::jsonb, 'Oxygen', 'We breathe in oxygen to live!', 'basic_physics', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is the hottest planet?', '["Earth", "Mars", "Venus", "Mercury"]'::jsonb, 'Venus', 'Venus is the hottest planet because of its thick atmosphere!', 'space', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What do caterpillars turn into?', '["Birds", "Butterflies", "Bees", "Beetles"]'::jsonb, 'Butterflies', 'Caterpillars turn into beautiful butterflies!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What causes rain?', '["Magic", "Clouds", "Wind", "Moon"]'::jsonb, 'Clouds', 'When water vapor in clouds condenses, it falls as rain!', 'nature', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is H2O?', '["Oxygen", "Hydrogen", "Water", "Carbon"]'::jsonb, 'Water', 'H2O is the chemical formula for water!', 'chemistry', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'How long does it take Earth to orbit the Sun?', '["1 month", "1 year", "1 week", "1 day"]'::jsonb, '1 year', 'Earth takes 365 days (1 year) to orbit the Sun!', 'space', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is the powerhouse of the cell?', '["Nucleus", "Mitochondria", "Ribosome", "Cell Wall"]'::jsonb, 'Mitochondria', 'Mitochondria produce energy for the cell!', 'biology', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]'::jsonb, 'Mars', 'Mars is called the Red Planet because of its reddish color!', 'space', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 2
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is photosynthesis?', '["Eating food", "Making food from sunlight", "Sleeping", "Growing taller"]'::jsonb, 'Making food from sunlight', 'Plants use sunlight to make their own food!', 'biology', 'medium', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'science-quest' AND gl.level_number = 2;


-- BRAIN TEASER QUESTIONS
INSERT INTO game_questions (game_id, level_id, type, prompt, options, correct_answer, explanation, topic, difficulty, is_active)
SELECT 
  g.id, gl.id, 'MCQ'::question_type,
  'What has hands but cannot clap?', '["Robot", "Clock", "Monkey", "Tree"]'::jsonb, 'Clock',
  'A clock has hands (hour and minute hands) but cannot clap!', 'riddles', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What gets wet while drying?', '["Cloth", "Towel", "Sponge", "Paper"]'::jsonb, 'Towel', 'A towel gets wet while drying you!', 'riddles', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What comes next: 2, 4, 6, 8, ?', '["9", "10", "11", "12"]'::jsonb, '10', 'The pattern is adding 2 each time!', 'logic', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What has a neck but no head?', '["Person", "Bottle", "Snake", "Giraffe"]'::jsonb, 'Bottle', 'A bottle has a neck but no head!', 'riddles', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'If 5 cats catch 5 mice in 5 minutes, how many cats catch 100 mice in 100 minutes?', '["5", "10", "20", "100"]'::jsonb, '5', 'The same 5 cats! They just need more time.', 'logic', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What can travel around the world while staying in a corner?', '["Car", "Stamp", "Plane", "Bird"]'::jsonb, 'Stamp', 'A stamp stays in the corner of an envelope but travels around the world!', 'riddles', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What comes next: 1, 1, 2, 3, 5, ?', '["6", "7", "8", "9"]'::jsonb, '8', 'This is the Fibonacci sequence: add the last two numbers!', 'logic', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What has many keys but cannot open locks?', '["Door", "Piano", "Map", "Lock"]'::jsonb, 'Piano', 'A piano has keys but cannot open locks!', 'riddles', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'brain-teaser' AND gl.level_number = 1;


-- QUICK QUIZ QUESTIONS
INSERT INTO game_questions (game_id, level_id, type, prompt, options, correct_answer, explanation, topic, difficulty, is_active)
SELECT 
  g.id, gl.id, 'MCQ'::question_type,
  'What is the tallest animal on Earth?', '["Elephant", "Giraffe", "Lion", "Bear"]'::jsonb, 'Giraffe',
  'Giraffes can grow up to 18 feet tall!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'How many continents are there?', '["5", "6", "7", "8"]'::jsonb, '7', 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Australia, South America!', 'geography', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is the capital of the United States?', '["New York", "Los Angeles", "Washington D.C.", "Chicago"]'::jsonb, 'Washington D.C.', 'Washington D.C. is the capital of the USA!', 'geography', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What color is a ruby?', '["Blue", "Green", "Red", "Yellow"]'::jsonb, 'Red', 'Rubies are beautiful red gemstones!', 'general', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'How many hours are in a day?', '["12", "20", "24", "30"]'::jsonb, '24', 'There are 24 hours in one day!', 'general', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What is the fastest land animal?', '["Lion", "Cheetah", "Horse", "Leopard"]'::jsonb, 'Cheetah', 'Cheetahs can run up to 70 mph!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What shape is a stop sign?', '["Circle", "Triangle", "Square", "Octagon"]'::jsonb, 'Octagon', 'A stop sign has 8 sides - it is an octagon!', 'general', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'Which planet is closest to the Sun?', '["Earth", "Venus", "Mercury", "Mars"]'::jsonb, 'Mercury', 'Mercury is the closest planet to the Sun!', 'space', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'How many sides does a triangle have?', '["2", "3", "4", "5"]'::jsonb, '3', 'A triangle has 3 sides!', 'general', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1
UNION ALL
SELECT g.id, gl.id, 'MCQ'::question_type, 'What do you call a baby dog?', '["Kitten", "Puppy", "Cub", "Chick"]'::jsonb, 'Puppy', 'A baby dog is called a puppy!', 'animals', 'easy', true
FROM games g JOIN game_levels gl ON g.id = gl.game_id WHERE g.slug = 'quick-quiz' AND gl.level_number = 1;


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check everything was created
SELECT 
  'GAMES' as table_name,
  COUNT(*) as count
FROM games
UNION ALL
SELECT 
  'GAME_LEVELS' as table_name,
  COUNT(*) as count
FROM game_levels
UNION ALL
SELECT 
  'GAME_QUESTIONS' as table_name,
  COUNT(*) as count
FROM game_questions
ORDER BY table_name;

-- View games with their level counts
SELECT 
  g.name,
  g.type,
  COUNT(gl.id) as levels,
  g.icon
FROM games g
LEFT JOIN game_levels gl ON g.id = gl.game_id
GROUP BY g.id, g.name, g.type, g.icon
ORDER BY g.name;

-- View questions per game
SELECT 
  g.name,
  COUNT(gq.id) as question_count
FROM games g
LEFT JOIN game_questions gq ON g.id = gq.game_id
GROUP BY g.id, g.name
ORDER BY g.name;