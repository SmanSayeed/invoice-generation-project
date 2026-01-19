-- ============================================
-- INVOICE GENERATION SYSTEM - COMPLETE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Drop existing views, tables, functions (in correct order)
DROP VIEW IF EXISTS public.dashboard_summary CASCADE;
DROP VIEW IF EXISTS public.customers_with_stats CASCADE;
DROP VIEW IF EXISTS public.projects_with_details CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_project_paid_amount();

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  details TEXT,
  start_date DATE,
  end_date DATE,
  total_cost DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  pending_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_cost - paid_amount) STORED,
  project_by TEXT,
  client_received_by TEXT,
  priority TEXT DEFAULT 'mid' CHECK (priority IN ('high', 'mid', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('ongoing', 'pending', 'completed', 'cancelled', 'paused')),
  invoice_no SERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update paid_amount when payments change
CREATE OR REPLACE FUNCTION public.update_project_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET paid_amount = COALESCE((SELECT SUM(amount) FROM public.payments WHERE project_id = OLD.project_id), 0)
    WHERE id = OLD.project_id;
    RETURN OLD;
  ELSE
    UPDATE public.projects 
    SET paid_amount = COALESCE((SELECT SUM(amount) FROM public.payments WHERE project_id = NEW.project_id), 0)
    WHERE id = NEW.project_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_project_paid_amount();

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Default settings
INSERT INTO public.settings (key, value) VALUES
  ('company_name', 'My Company'),
  ('company_address', ''),
  ('company_phone', ''),
  ('company_email', ''),
  ('currency_symbol', '৳'),
  ('invoice_prefix', 'INV');

-- ============================================
-- VIEWS
-- ============================================

-- Customers with project stats
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

-- Projects with customer info (named projects_with_details to match hooks)
CREATE VIEW public.projects_with_details AS
SELECT 
  p.*,
  c.name AS customer_name,
  c.mobile AS customer_mobile,
  c.email AS customer_email,
  c.address AS customer_address
FROM public.projects p
LEFT JOIN public.customers c ON p.customer_id = c.id;

-- Dashboard summary stats
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
-- DISABLE RLS (SIMPLE MODE)
-- ============================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Grant all access
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.projects TO anon, authenticated;
GRANT ALL ON public.payments TO anon, authenticated;
GRANT ALL ON public.settings TO anon, authenticated;
GRANT SELECT ON public.customers_with_stats TO anon, authenticated;
GRANT SELECT ON public.projects_with_details TO anon, authenticated;
GRANT SELECT ON public.dashboard_summary TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Sample customers
INSERT INTO public.customers (name, mobile, email, address) VALUES
  ('রহিম আহমেদ', '01712345678', 'rahim@example.com', 'ঢাকা, বাংলাদেশ'),
  ('করিম হোসেন', '01812345678', 'karim@example.com', 'চট্টগ্রাম, বাংলাদেশ'),
  ('জামাল উদ্দিন', '01912345678', 'jamal@example.com', 'সিলেট, বাংলাদেশ');

-- Sample projects
INSERT INTO public.projects (customer_id, title, details, total_cost, paid_amount, status, priority, start_date) VALUES
  ((SELECT id FROM public.customers LIMIT 1), 'ওয়েবসাইট ডেভেলপমেন্ট', 'ই-কমার্স ওয়েবসাইট তৈরি', 50000, 25000, 'ongoing', 'high', CURRENT_DATE),
  ((SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'মোবাইল অ্যাপ', 'অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্ট', 80000, 40000, 'pending', 'mid', CURRENT_DATE),
  ((SELECT id FROM public.customers LIMIT 1 OFFSET 2), 'লোগো ডিজাইন', 'কোম্পানি লোগো ডিজাইন', 10000, 10000, 'completed', 'low', CURRENT_DATE - INTERVAL '30 days');

-- Sample payments
INSERT INTO public.payments (project_id, amount, payment_date, note) VALUES
  ((SELECT id FROM public.projects LIMIT 1), 25000, CURRENT_DATE, 'অগ্রিম পেমেন্ট'),
  ((SELECT id FROM public.projects LIMIT 1 OFFSET 1), 40000, CURRENT_DATE, 'প্রথম কিস্তি'),
  ((SELECT id FROM public.projects LIMIT 1 OFFSET 2), 10000, CURRENT_DATE - INTERVAL '15 days', 'সম্পূর্ণ পেমেন্ট');

-- ============================================
-- DONE! Schema created with sample data.
-- ============================================