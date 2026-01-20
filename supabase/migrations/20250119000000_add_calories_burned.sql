-- Add calories_burned column to workouts table
-- This tracks estimated calories burned during each workout

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS calories_burned INTEGER;

-- Add a comment explaining the column
COMMENT ON COLUMN workouts.calories_burned IS 'Estimated calories burned during the workout';
