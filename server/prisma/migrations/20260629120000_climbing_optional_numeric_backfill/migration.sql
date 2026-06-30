-- Backfill official climbing records that stored the EOOA altitude floor (1000 m)
-- when the user left the field empty. Scoring is unchanged because the formula
-- applies the same 1000 m floor at calculation time.
UPDATE climbing_activity_details
SET altitude = 0
WHERE altitude = 1000
  AND activity_id IN (
    SELECT id FROM activities WHERE category = 'climbing' AND is_official = true
  );
