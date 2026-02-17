ALTER TABLE meal_entries
ADD COLUMN IF NOT EXISTS thaw_reminder_label TEXT,
ADD COLUMN IF NOT EXISTS thaw_lead_days SMALLINT;

UPDATE meal_entries me
SET
  thaw_reminder_label = tr.name,
  thaw_lead_days = tr.lead_days
FROM thaw_rules tr
WHERE me.thaw_rule_id = tr.id
  AND (me.thaw_reminder_label IS NULL OR me.thaw_lead_days IS NULL);

UPDATE meal_entries
SET thaw_lead_days = 1
WHERE thaw_reminder_label IS NOT NULL
  AND thaw_lead_days IS NULL;
