-- ============================================
-- MIGRATION: Change project_items.amount from generated to direct input
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the existing trigger first (to avoid conflicts)
DROP TRIGGER IF EXISTS sync_project_total ON public.project_items;

-- Step 2: Create a new table with the correct structure
CREATE TABLE public.project_items_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  rate DECIMAL(12,2) DEFAULT 0,
  amount DECIMAL(12,2) DEFAULT 0, -- Changed: Now a regular column, not generated
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Copy data from old table to new table
-- Calculate amount from old data (quantity * rate) for existing records
INSERT INTO public.project_items_new (id, project_id, title, details, quantity, rate, amount, sort_order, created_at)
SELECT id, project_id, title, details, quantity, rate, COALESCE(quantity * rate, 0), sort_order, created_at
FROM public.project_items;

-- Step 4: Drop old table and rename new table
DROP TABLE public.project_items;
ALTER TABLE public.project_items_new RENAME TO project_items;

-- Step 5: Recreate the index
CREATE INDEX idx_project_items_project_id ON public.project_items(project_id);

-- Step 6: Update the trigger function to sum amount directly instead of quantity * rate
CREATE OR REPLACE FUNCTION public.update_project_total_from_items()
RETURNS TRIGGER AS $$
DECLARE
  new_total DECIMAL(12,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Changed: Sum amount directly instead of quantity * rate
    SELECT COALESCE(SUM(amount), 0) INTO new_total
    FROM public.project_items 
    WHERE project_id = OLD.project_id;
    
    UPDATE public.projects 
    SET total_cost = new_total
    WHERE id = OLD.project_id;
    
    RETURN OLD;
  ELSE
    -- Changed: Sum amount directly instead of quantity * rate
    SELECT COALESCE(SUM(amount), 0) INTO new_total
    FROM public.project_items 
    WHERE project_id = NEW.project_id;
    
    UPDATE public.projects 
    SET total_cost = new_total
    WHERE id = NEW.project_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Recreate the trigger
CREATE TRIGGER sync_project_total
  AFTER INSERT OR UPDATE OR DELETE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION public.update_project_total_from_items();

-- Step 8: Enable RLS on the new table
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

-- Step 9: Recreate RLS policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_items;
CREATE POLICY "Enable all access for authenticated users" ON public.project_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Verification: Check the new structure
-- SELECT column_name, data_type, is_generated FROM information_schema.columns WHERE table_name = 'project_items';
