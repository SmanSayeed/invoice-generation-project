-- ============================================
-- SCHEMA UPDATE - Run this to fix errors
-- This adds the missing views
-- ============================================

-- Drop existing views if any
DROP VIEW IF EXISTS public.dashboard_summary CASCADE;
DROP VIEW IF EXISTS public.customers_with_stats CASCADE;
DROP VIEW IF EXISTS public.projects_with_details CASCADE;

-- ============================================
-- VIEW: Customers with project stats
-- ============================================
CREATE VIEW public.customers_with_stats AS
SELECT 
  c.*,
  COALESCE(COUNT(p.id), 0)::INTEGER AS total_projects,
  COALESCE(SUM(p.total_cost), 0)::DECIMAL AS total_amount,
  COALESCE(SUM(p.paid_amount), 0)::DECIMAL AS paid_amount,
  COALESCE(SUM(p.pending_amount), 0)::DECIMAL AS pending_amount
FROM public.customers c
LEFT JOIN public.projects p ON c.id = p.customer_id
GROUP BY c.id;

-- ============================================
-- VIEW: Projects with customer info
-- ============================================
CREATE VIEW public.projects_with_details AS
SELECT 
  p.*,
  c.name AS customer_name,
  c.mobile AS customer_mobile,
  c.email AS customer_email,
  c.address AS customer_address
FROM public.projects p
LEFT JOIN public.customers c ON p.customer_id = c.id;

-- ============================================
-- VIEW: Dashboard summary stats
-- ============================================
CREATE VIEW public.dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM public.customers)::INTEGER AS total_customers,
  (SELECT COUNT(*) FROM public.projects)::INTEGER AS total_projects,
  (SELECT COUNT(*) FROM public.projects WHERE status IN ('ongoing', 'pending', 'paused'))::INTEGER AS pending_projects,
  (SELECT COUNT(*) FROM public.projects WHERE status = 'completed')::INTEGER AS completed_projects,
  (SELECT COALESCE(SUM(total_cost), 0) FROM public.projects)::DECIMAL AS total_amount,
  (SELECT COALESCE(SUM(paid_amount), 0) FROM public.projects)::DECIMAL AS paid_amount,
  (SELECT COALESCE(SUM(pending_amount), 0) FROM public.projects)::DECIMAL AS pending_amount;

-- ============================================
-- Grant permissions on views
-- ============================================
GRANT SELECT ON public.customers_with_stats TO anon, authenticated;
GRANT SELECT ON public.projects_with_details TO anon, authenticated;
GRANT SELECT ON public.dashboard_summary TO anon, authenticated;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Sample customers
INSERT INTO public.customers (name, mobile, email, address) VALUES
  ('রহিম আহমেদ', '01712345678', 'rahim@example.com', 'ঢাকা, বাংলাদেশ'),
  ('করিম হোসেন', '01812345678', 'karim@example.com', 'চট্টগ্রাম, বাংলাদেশ'),
  ('জামাল উদ্দিন', '01912345678', 'jamal@example.com', 'সিলেট, বাংলাদেশ')
ON CONFLICT DO NOTHING;

-- Sample projects (only if customers exist)
DO $$
DECLARE
  cust1 UUID;
  cust2 UUID;
  cust3 UUID;
BEGIN
  SELECT id INTO cust1 FROM public.customers WHERE mobile = '01712345678';
  SELECT id INTO cust2 FROM public.customers WHERE mobile = '01812345678';
  SELECT id INTO cust3 FROM public.customers WHERE mobile = '01912345678';
  
  IF cust1 IS NOT NULL THEN
    INSERT INTO public.projects (customer_id, title, details, total_cost, paid_amount, status, priority, start_date)
    VALUES (cust1, 'ওয়েবসাইট ডেভেলপমেন্ট', 'ই-কমার্স ওয়েবসাইট তৈরি', 50000, 25000, 'ongoing', 'high', CURRENT_DATE)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF cust2 IS NOT NULL THEN
    INSERT INTO public.projects (customer_id, title, details, total_cost, paid_amount, status, priority, start_date)
    VALUES (cust2, 'মোবাইল অ্যাপ', 'অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্ট', 80000, 40000, 'pending', 'mid', CURRENT_DATE)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF cust3 IS NOT NULL THEN
    INSERT INTO public.projects (customer_id, title, details, total_cost, paid_amount, status, priority, start_date)
    VALUES (cust3, 'লোগো ডিজাইন', 'কোম্পানি লোগো ডিজাইন', 10000, 10000, 'completed', 'low', CURRENT_DATE - INTERVAL '30 days')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- DONE! Views created and sample data added.
-- ============================================
