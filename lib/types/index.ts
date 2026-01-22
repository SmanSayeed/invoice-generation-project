// Customer Types
export interface Customer {
    id: string;
    name: string;
    mobile: string;
    email?: string | null;
    address?: string | null;
    details?: string | null;
    added_by?: string | null;
    referred_by?: string | null;
    status: "active" | "inactive";
    tag: "special" | "normal";
    created_at: string;
    updated_at: string;
}

export interface CustomerWithStats extends Customer {
    total_projects: number;
    running_projects: number;
    completed_projects: number;
}

export interface CreateCustomerInput {
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    details?: string;
    added_by?: string;
    referred_by?: string;
    status?: "active" | "inactive";
    tag?: "special" | "normal";
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

// Project Types
export interface Project {
    id: string;
    title: string;
    details?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    total_cost: number;
    paid_amount: number;
    pending_amount: number;
    customer_id: string;
    project_by?: string | null;
    client_received_by?: string | null;
    priority: "high" | "mid" | "low";
    status: "ongoing" | "pending" | "completed" | "cancelled" | "paused";
    invoice_no: number;
    created_at: string;
    updated_at: string;
}

export interface ProjectWithDetails extends Project {
    customer_name?: string | null;
    customer_mobile?: string | null;
    customer_email?: string | null;
    customer_address?: string | null;
    payment_count: number;
    last_payment_date?: string | null;
    items?: ProjectItem[];
}

export interface CreateProjectInput {
    title: string;
    details?: string;
    start_date?: string;
    end_date?: string;
    total_cost?: number;
    paid_amount?: number;
    customer_id: string;
    project_by?: string;
    client_received_by?: string;
    priority?: "high" | "mid" | "low";
    status?: "ongoing" | "pending" | "completed" | "cancelled" | "paused";
    items?: CreateProjectItemInput[];
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, "customer_id">>;

// Project Item Types
export interface ProjectItem {
    id: string;
    project_id: string;
    title: string;
    details?: string | null;
    quantity: number;
    rate: number;
    amount: number;
    sort_order: number;
    created_at: string;
}

export interface CreateProjectItemInput {
    project_id?: string; // Optional when creating with project
    title: string;
    details?: string;
    quantity?: number;
    rate?: number;
    sort_order?: number;
}

export type UpdateProjectItemInput = Partial<Omit<CreateProjectItemInput, "project_id">>;

// Payment Types
export interface Payment {
    id: string;
    project_id: string;
    amount: number;
    payment_date: string;
    note?: string | null;
    created_at: string;
}

export interface CreatePaymentInput {
    project_id: string;
    amount: number;
    payment_date?: string;
    note?: string;
}

export type UpdatePaymentInput = Partial<Omit<CreatePaymentInput, "project_id">>;

// Settings Types
export interface Settings {
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
}

export interface AppSettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    currency_symbol: string;
    invoice_prefix: string;
}

// Profile Types
export interface Profile {
    id: string;
    email?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    created_at: string;
    updated_at: string;
}

// Dashboard Types
export interface DashboardSummary {
    total_customers: number;
    total_projects: number;
    pending_projects: number;
    completed_projects: number;
    total_amount: number;
    pending_amount: number;
}

// Filter Types
export interface CustomerFilters {
    search?: string;
    status?: "active" | "inactive" | "all";
    tag?: "special" | "normal" | "all";
    dateFrom?: string;
    dateTo?: string;
    sortBy?: "latest" | "oldest" | "total_projects";
}

export interface ProjectFilters {
    search?: string;
    invoiceNo?: string;
    status?: "ongoing" | "pending" | "completed" | "cancelled" | "paused" | "all";
    priority?: "high" | "mid" | "low" | "all";
    customerId?: string;
    paymentStatus?: "paid" | "unpaid" | "all";
    dateFrom?: string;
    dateTo?: string;
    sortBy?: "latest" | "oldest";
}

// Pagination Types
export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
