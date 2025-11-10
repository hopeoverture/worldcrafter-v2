-- Add full-text search to locations table
-- This enables fast searching across location name, description, geography, culture, economy, and government fields

-- Step 1: Add search_vector column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 2: Create function to update search_vector
CREATE OR REPLACE FUNCTION locations_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Combine searchable fields with different weights:
  -- A = highest weight (name, type)
  -- B = high weight (description)
  -- C = medium weight (geography, culture, government)
  -- D = lowest weight (economy, climate, population)
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.geography, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.culture, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.government, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.economy, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.climate, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.population, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to automatically update search_vector on INSERT or UPDATE
DROP TRIGGER IF EXISTS locations_search_vector_trigger ON locations;
CREATE TRIGGER locations_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, type, description, geography, culture, government, economy, climate, population
  ON locations
  FOR EACH ROW
  EXECUTE FUNCTION locations_search_vector_update();

-- Step 4: Create GIN index on search_vector for fast full-text search
CREATE INDEX IF NOT EXISTS locations_search_vector_idx ON locations USING gin(search_vector);

-- Step 5: Update existing rows with search vectors
UPDATE locations SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(type, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(geography, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(culture, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(government, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(economy, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(climate, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(population, '')), 'D')
WHERE search_vector IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Full-text search successfully set up for locations table';
  RAISE NOTICE '- Added search_vector column';
  RAISE NOTICE '- Created GIN index for fast searching';
  RAISE NOTICE '- Added trigger to auto-update search vector';
  RAISE NOTICE 'You can now use ts_rank() for relevance scoring and @@ for matching';
END $$;
