/*
  # Add registration number to states_registered

  1. Modified Tables
    - `states_registered`
      - Added `registration_number` (text, nullable) - tracks the state-issued registration or license number

  2. Notes
    - No data loss, purely additive change
    - Column is nullable since not all states issue registration numbers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'states_registered' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE states_registered ADD COLUMN registration_number text;
  END IF;
END $$;