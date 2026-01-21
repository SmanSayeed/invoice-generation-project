-- =========================================================
-- MIGRATION: ADD PROJECT ITEMS
-- Run this script in the Supabase SQL Editor to update your database
-- =========================================================

-- 1. Create project_items table
CREATE TABLE IF NOT EXISTS public.project_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  rate DECIMAL(12,2) DEFAULT 0,
  amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_project_items_project_id ON public.project_items(project_id);

-- 3. Create function to update project total cost automatically
CREATE OR REPLACE FUNCTION public.update_project_total_from_items()
RETURNS TRIGGER AS $$
DECLARE
  new_total DECIMAL(12,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(SUM(quantity * rate), 0) INTO new_total
    FROM public.project_items 
    WHERE project_id = OLD.project_id;
    
    UPDATE public.projects 
    SET total_cost = new_total
    WHERE id = OLD.project_id;
    
    RETURN OLD;
  ELSE
    SELECT COALESCE(SUM(quantity * rate), 0) INTO new_total
    FROM public.project_items 
    WHERE project_id = NEW.project_id;
    
    UPDATE public.projects 
    SET total_cost = new_total
    WHERE id = NEW.project_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to fire the function
DROP TRIGGER IF EXISTS update_project_total_from_items ON public.project_items;
CREATE TRIGGER update_project_total_from_items
  AFTER INSERT OR UPDATE OR DELETE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION public.update_project_total_from_items();

-- 5. Grant permissions and disable RLS (for open access as per your schema)
ALTER TABLE public.project_items DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.project_items TO anon, authenticated;

-- Confirmation
SELECT 'Migration completed successfully. project_items table created.' as result;
