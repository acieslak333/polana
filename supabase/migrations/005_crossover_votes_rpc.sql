-- Atomic increment for crossover vote counts
CREATE OR REPLACE FUNCTION increment_crossover_votes(crossover_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE crossover_proposals
  SET vote_count = vote_count + 1
  WHERE id = crossover_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
