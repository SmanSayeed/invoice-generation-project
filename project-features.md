# Software Requirements Specification (SRS) for Dynamic Invoice Generation System

## 1. Introduction

### 1.1 Purpose
This document outlines the complete requirements for a web-based dynamic invoice generation system. The system is designed for a single admin user to manage customers, projects, and generate invoices. It supports CRUD operations for customers and projects, dashboard summaries, filtering/sorting, data exports, and PDF invoice generation. The application must handle both English and Bangla (Bengali) inputs, displays, and outputs seamlessly.

### 1.2 Scope
- **User Management**: Single admin user with authentication and profile updates.
- **Customer Management**: Create, read, update, delete (CRUD) customers with filtering, sorting, and export.
- **Project Management**: CRUD projects linked to customers, with payment tracking, status management, filtering, sorting, and export.
- **Invoice Generation**: Dynamic PDF invoices per project with auto-incrementing invoice numbers.
- **Dashboard**: Summary analytics for quick insights.
- **Internationalization**: Support for English and Bangla in forms, tables, and invoices.
- **Exclusions**: No multi-user support, no roles beyond admin, no payment gateways, no email/SMS integrations.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SRS**: Software Requirements Specification
- **CRUD**: Create, Read, Update, Delete
- **Admin**: The sole user with full access.
- **Customer**: Entity for whom projects are created.
- **Project**: A billable task or service linked to a customer.
- **Invoice**: PDF document generated from project data.
- **Supabase**: Cloud-based PostgreSQL database with authentication.
- **Tanstack Query**: For data fetching and caching.
- **Zustand**: For state management.
- **Tailwind CSS**: For styling.
- **Next.js**: Framework for the frontend (server-side rendering, routing).

### 1.4 References
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Tanstack Query: https://tanstack.com/query
- Zustand: https://zustand-demo.pmnd.rs/

### 1.5 Overview
The system is a single-page application (SPA) built with Next.js, using Supabase for authentication and data storage. The admin logs in, views a dashboard, manages customers and projects, and generates invoices.

## 2. Overall Description

### 2.1 Product Perspective
This is a standalone admin tool for managing a small business's invoicing needs, focusing on simplicity and efficiency for one user.

### 2.2 Product Functions
- Authentication and profile management.
- Dashboard with key metrics.
- Customer CRUD with advanced filtering/sorting and export.
- Project CRUD with payment milestones, status tracking, filtering/sorting, and export.
- Dynamic PDF invoice generation and download.
- Support for bilingual (English/Bangla) data handling.

### 2.3 User Classes and Characteristics
- **Admin**: Sole user, tech-savvy, manages all operations.

### 2.4 Operating Environment
- Web browser: Chrome, Firefox (latest versions).
- Server: Next.js on Vercel or similar.
- Database: Supabase (PostgreSQL).
- Client-side: Supports desktop and mobile responsiveness.

### 2.5 Design and Implementation Constraints
- Tech Stack: Next.js (pages or app router), Tailwind CSS for UI, Tanstack Query for API calls, Zustand for state.
- Database: Supabase with PostgreSQL schemas.
- Authentication: Supabase Auth (email/password).
- PDF Generation: Use libraries like pdf-lib or react-pdf (client-side).
- Rich Text Editor: For project details (e.g., Quill or TinyMCE).
- Export: Use libraries like xlsx for Excel/CSV.
- Bilingual Support: Ensure UTF-8 encoding; use fonts supporting Bangla (e.g., Noto Sans Bengali).

### 2.6 Assumptions and Dependencies
- Supabase project is set up with authentication enabled.
- Admin user is seeded via SQL.
- No external APIs needed beyond Supabase.
- PDF generation handles Bangla text correctly.

## 3. Functional Requirements

### 3.1 Authentication and User Management
- **FR1.1**: Admin login with username (a@a.com) and password (11112222).
- **FR1.2**: On successful login, redirect to dashboard.
- **FR1.3**: Admin can update profile: username, password, name, email.
- **FR1.4**: Logout functionality.
- **FR1.5**: Session management using Supabase Auth and Zustand.

### 3.2 Dashboard
- **FR2.1**: Display summaries:
  - Total customers.
  - Total projects.
  - Pending projects (status: pending, ongoing, paused).
  - Completed projects (status: completed).
  - Total amount of money (sum of all project total_cost).
  - Pending amount to receive (sum of all project pending_amount).
- **FR2.2**: Use Tanstack Query to fetch and cache data.
- **FR2.3**: Responsive design: Cards on mobile, grid on desktop.

### 3.3 Customer Management
- **FR3.1**: Create customer form:
  - Required: name, mobile.
  - Optional: email, address, details, added_by (name), referred_by (name), status (e.g., active/inactive), tag (special/normal).
  - Save button: On success, redirect to customers list, show latest at top.
- **FR3.2**: Customers list page:
  - Display as responsive table (desktop) or cards (mobile).
  - Columns/Fields: Name, email, address, tag, creation date, total projects, running projects, completed projects.
  - Hidden: Status.
  - Actions: View projects list for customer, create project for customer.
- **FR3.3**: Filtering/Sorting:
  - Sort: Latest/oldest, by total projects.
  - Filter: Today, within week, month, date range, search by name/mobile.
- **FR3.4**: Export: Download filtered/all customers as Excel/CSV (include all fields).
- **FR3.5**: Edit/Update/Delete customers (with confirmation for delete).
- **FR3.6**: Bilingual support in forms and displays.

### 3.4 Project Management
- **FR4.1**: Create project form:
  - Required: Title, customer (select from list).
  - Optional: Details (rich text editor, truncated to 50 chars in lists with "view details" button), start date, end date, total_cost, paid_amount (initial), project_by (name), client_received_by (name), priority (high/mid/low), status (ongoing/pending/completed/cancelled/paused).
  - Pending_amount: Auto-calculated (total_cost - paid_amount).
  - On create: Show in list by latest order, responsive cards (mobile/desktop).
- **FR4.2**: Projects list page:
  - Display as responsive cards/table.
  - Fields: Title, details (truncated), customer name (linked to customer details), start date, end date, status, price (total_cost), paid amount, pending amount, project_by, client_received_by, priority.
  - Actions: View, edit, update, delete, generate invoice, add payment.
- **FR4.3**: Payment Management:
  - Button: "Add new payment" – Form for amount, date, note (milestone-based).
  - Update project's paid_amount = sum of all payments for the project.
  - List payments with dates in project view.
- **FR4.4**: Filtering/Sorting:
  - Sort: Latest/oldest.
  - Filter: Daily, weekly, monthly, date range, by customer, by status, by paid/unpaid (pending_amount > 0), priority.
- **FR4.5**: Per-customer projects list: From customer view, show projects with title, start/end date, status, price, paid/pending.
- **FR4.6**: Export: Download filtered/all projects as Excel/CSV (include all fields and payments as sub-rows or separate sheet).
- **FR4.7**: Bilingual support.

### 3.5 Invoice Generation
- **FR5.1**: Generate button per project: Creates dynamic PDF.
- **FR5.2**: Invoice Fields (bilingual support):
  - ইনভয়েস নং: (Auto-increment from last, serialized).
  - Date: (Generation date).
  - গ্রাহকের নাম: (Customer name).
  - ঠিকানা: (Customer address).
  - মোবাইল: (Customer mobile).
  - Project for: (Project title).
  - Client received by: (Client_received_by).
  - Details: Project details (rich text).
  - Status, total cost, paid amount, pending amount.
  - Payment details: List of payments with dates/amounts (memo style).
- **FR5.3**: Download as PDF on click.
- **FR5.4**: Design: Professional layout, support Bangla fonts.
- **FR5.5**: Invoice number management: Use a database sequence or settings table for auto-increment.

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load < 2 seconds.
- Queries optimized with Tanstack Query caching.
- Handle up to 1000 customers/projects efficiently.

### 4.2 Security
- Supabase Row Level Security (RLS) to restrict to admin.
- Validate inputs to prevent SQL injection/XSS.
- Secure authentication with Supabase.

### 4.3 Reliability
- Error handling: User-friendly messages.
- Data backups via Supabase.

### 4.4 Usability
- Responsive UI with Tailwind CSS.
- Intuitive navigation.
- Bilingual support: Detect or allow switching; default to mixed.

### 4.5 Maintainability
- Modular code with Next.js components.
- Use Zustand for global state.

### 4.6 Portability
- Web-based, cross-browser.

## 5. Database Design (Supabase SQL)

Supabase uses PostgreSQL. Below is the SQL schema for tables. Use Supabase Auth for users (auth.users table). Enable RLS on all tables to allow only authenticated admin access.

### 5.1 Tables

```sql
-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    address TEXT,
    details TEXT,
    added_by TEXT,
    referred_by TEXT,
    status TEXT DEFAULT 'active',  -- e.g., active, inactive
    tag TEXT DEFAULT 'normal',     -- special, normal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    details TEXT,  -- Rich text
    start_date DATE,
    end_date DATE,
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    pending_amount DECIMAL(10, 2) GENERATED ALWAYS AS (total_cost - paid_amount) STORED,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    project_by TEXT,
    client_received_by TEXT,
    priority TEXT DEFAULT 'mid',  -- high, mid, low
    status TEXT DEFAULT 'pending',  -- ongoing, pending, completed, cancelled, paused
    invoice_no SERIAL UNIQUE,  -- Auto-increment for invoice number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table (for milestones)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    note TEXT,  -- Milestone note
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table (optional, for any global settings, e.g., if sequence needs tracking)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
-- Insert initial invoice start if needed, but using SERIAL on projects.invoice_no is sufficient.

-- Triggers: Update paid_amount on payment insert/update/delete
CREATE OR REPLACE FUNCTION update_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET paid_amount = (SELECT SUM(amount) FROM payments WHERE project_id = NEW.project_id)
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_paid_after_insert
AFTER INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION update_paid_amount();

CREATE TRIGGER trg_update_paid_after_update
AFTER UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_paid_amount();

CREATE TRIGGER trg_update_paid_after_delete
AFTER DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_paid_amount();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.2 SQL Seeder for Admin User
Supabase Auth handles users. To seed the admin:

```sql
-- Insert into auth.users (manually or via Supabase dashboard, but SQL for reference)
-- Note: In production, use Supabase signup or dashboard. For seeding:
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_token, confirmed_at)
VALUES (
    uuid_generate_v4(),
    'a@a.com',
    crypt('11112222', gen_salt('bf')),  -- Use proper hashing; this is illustrative
    CURRENT_TIMESTAMP,
    '',
    CURRENT_TIMESTAMP
);
-- Additionally, insert into a profiles table if needed for name/email, but for simplicity, use auth.users.
```

Enable RLS policies in Supabase dashboard:
- For all tables: `authenticated` users can SELECT, INSERT, UPDATE, DELETE (since single admin).

## 6. Appendix

### 6.1 Use Cases
- UC1: Admin logs in → Views dashboard.
- UC2: Create customer → Redirect to list.
- UC3: Filter customers → Export CSV.
- UC4: Create project for customer → Add payments → Generate PDF invoice.

### 6.2 Wireframes (Conceptual)
- Dashboard: Grid of summary cards.
- Lists: DataTable with filters (use Tanstack Table if needed).
- Forms: Tailwind-styled inputs, rich editor for details.
- Invoice: Memo-style PDF with tables for payments.

This SRS covers all specified features. Implementation details are left to development.