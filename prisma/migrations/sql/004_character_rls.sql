-- Enable RLS on characters table
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Users can access characters in their worlds
CREATE POLICY "Users can access own world characters"
  ON characters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Users can create characters in their worlds
CREATE POLICY "Users can create characters in own worlds"
  ON characters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Users can update characters in their worlds
CREATE POLICY "Users can update own world characters"
  ON characters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters."worldId"
      AND worlds."userId" = auth.uid()
    )
  );

-- Users can delete characters in their worlds
CREATE POLICY "Users can delete own world characters"
  ON characters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = characters."worldId"
      AND worlds."userId" = auth.uid()
    )
  );
