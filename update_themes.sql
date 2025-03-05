-- First, rename the columns if they exist with the old names
ALTER TABLE themes 
  RENAME COLUMN opening_slide_id TO opening_template_id;
ALTER TABLE themes 
  RENAME COLUMN agenda_slide_id TO agenda_template_id;
ALTER TABLE themes 
  RENAME COLUMN content_slide_id TO content_template_id;
ALTER TABLE themes 
  RENAME COLUMN offer_stack_slide_id TO offer_template_id;
ALTER TABLE themes 
  RENAME COLUMN ending_slide_id TO closing_template_id;

-- Then ensure all columns exist with the correct names
ALTER TABLE themes 
  ADD COLUMN IF NOT EXISTS opening_template_id TEXT,
  ADD COLUMN IF NOT EXISTS agenda_template_id TEXT,
  ADD COLUMN IF NOT EXISTS content_template_id TEXT,
  ADD COLUMN IF NOT EXISTS offer_template_id TEXT,
  ADD COLUMN IF NOT EXISTS closing_template_id TEXT;

-- Update any null values with default template IDs
UPDATE themes 
SET 
  opening_template_id = COALESCE(opening_template_id, 'default_opening'),
  agenda_template_id = COALESCE(agenda_template_id, 'default_agenda'),
  content_template_id = COALESCE(content_template_id, 'default_content'),
  offer_template_id = COALESCE(offer_template_id, 'default_offer'),
  closing_template_id = COALESCE(closing_template_id, 'default_closing')
WHERE 
  opening_template_id IS NULL 
  OR agenda_template_id IS NULL 
  OR content_template_id IS NULL 
  OR offer_template_id IS NULL 
  OR closing_template_id IS NULL;