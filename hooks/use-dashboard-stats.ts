import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DashboardSummary, ProjectFilters } from "@/lib/types";

export function useDashboardStats(filters: Partial<ProjectFilters>) {
    const supabase = createClient();
    const dateField = filters.dateField || "created_at";

    return useQuery({
        queryKey: ["dashboard-stats", filters],
        queryFn: async (): Promise<DashboardSummary> => {
            // Helper to apply date filter to a query
            const applyDateFilter = (query: any, tableField?: string) => {
                const field = tableField || dateField;

                if (filters.dateFrom) {
                    let fromDate = filters.dateFrom;
                    if ((field === "created_at" || field === "updated_at") && fromDate.length === 10) {
                        // Construct local date to ensure we capture the full day in user's timezone
                        const [y, m, d] = fromDate.split("-").map(Number);
                        const start = new Date(y, m - 1, d, 0, 0, 0, 0);
                        fromDate = start.toISOString();
                    }
                    query = query.gte(field, fromDate);
                }

                if (filters.dateTo) {
                    let toDate = filters.dateTo;
                    if ((field === "created_at" || field === "updated_at") && toDate.length === 10) {
                        // Construct local date and set to end of day
                        const [y, m, d] = toDate.split("-").map(Number);
                        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
                        toDate = end.toISOString();
                    }
                    query = query.lte(field, toDate);
                }

                return query;
            };

            // 1. Total Customers
            let customersQuery = supabase.from("customers").select("*", { count: "exact", head: true });
            customersQuery = applyDateFilter(customersQuery, "created_at"); // Customers always filtered by created_at usually? Or should use dateField? 
            // If dateField is 'start_date', customers don't have it.
            // Dashboard 'Date Filter' usually applies to the main entity (Projects).
            // For customers, let's stick to created_at if the filter is set, assuming the user interprets "Today" as "New Customers Today".
            const { count: totalCustomers } = await customersQuery;

            // 2. Total Projects
            let projectsQuery = supabase.from("projects").select("*", { count: "exact", head: true });
            projectsQuery = applyDateFilter(projectsQuery);
            const { count: totalProjects } = await projectsQuery;

            // 3. Pending Projects (Pending, Ongoing, Paused)
            let pendingProjectsQuery = supabase
                .from("projects")
                .select("*", { count: "exact", head: true })
                .in("status", ["pending", "ongoing", "paused"]);
            pendingProjectsQuery = applyDateFilter(pendingProjectsQuery);
            const { count: pendingProjects } = await pendingProjectsQuery;

            // 4. Completed Projects (Delivered)
            let completedProjectsQuery = supabase
                .from("projects")
                .select("*", { count: "exact", head: true })
                .eq("status", "delivered");
            completedProjectsQuery = applyDateFilter(completedProjectsQuery);
            const { count: completedProjects } = await completedProjectsQuery;

            // 5. Financials (Total Revenue & Pending Amount)
            // We need to sum columns, which requires fetching data (Supabase doesn't have sum aggregate in JS client easily without RPC or fetching)
            // Fetching only necessary columns to minimize data transfer
            let financialsQuery = supabase
                .from("projects")
                .select("total_cost, pending_amount, paid_amount");
            financialsQuery = applyDateFilter(financialsQuery);
            const { data: financialsData } = await financialsQuery;

            const totalAmount = financialsData?.reduce((sum, p) => sum + (p.total_cost || 0), 0) || 0;
            const pendingAmount = financialsData?.reduce((sum, p) => sum + (p.pending_amount || 0), 0) || 0;

            return {
                total_customers: totalCustomers || 0,
                total_projects: totalProjects || 0,
                pending_projects: pendingProjects || 0,
                completed_projects: completedProjects || 0,
                total_amount: totalAmount,
                pending_amount: pendingAmount,
            };
        },
    });
}
