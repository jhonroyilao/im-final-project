-- Migration script to add priority_level column to reservations table
-- This script should be run after the initial table creation

-- Add priority_level column to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS priority_level INTEGER NOT NULL DEFAULT 4 CHECK (priority_level BETWEEN 1 AND 4);

-- Add comment to explain the priority levels
COMMENT ON COLUMN reservations.priority_level IS 'Priority levels: 1=University/College Functions, 2=Scheduled Regular Classes, 3=Make-up/Tutorial Classes, 4=Co-curricular Activities'; 