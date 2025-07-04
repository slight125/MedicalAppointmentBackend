-- Add paid column to appointments table
ALTER TABLE appointments ADD COLUMN paid BOOLEAN DEFAULT FALSE;

-- Update existing appointments to have paid = false
UPDATE appointments SET paid = FALSE WHERE paid IS NULL;

-- Create index for better performance
CREATE INDEX idx_appointments_paid ON appointments(paid);
