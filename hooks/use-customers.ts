"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
    Customer,
    CustomerWithStats,
    CreateCustomerInput,
    UpdateCustomerInput,
    CustomerFilters,
    PaginatedResponse,
} from "@/lib/types";
import { toast } from "sonner";

const CUSTOMERS_QUERY_KEY = "customers";

export function useCustomers(
    filters: CustomerFilters = {},
    page: number = 1,
    pageSize: number = 10
) {
    const supabase = createClient();

    return useQuery({
        queryKey: [CUSTOMERS_QUERY_KEY, filters, page, pageSize],
        queryFn: async (): Promise<PaginatedResponse<CustomerWithStats>> => {
            let query = supabase
                .from("customers_with_stats")
                .select("*", { count: "exact" });

            // Search filter
            if (filters.search) {
                query = query.or(
                    `name.ilike.%${filters.search}%,mobile.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
                );
            }

            // Status filter
            if (filters.status && filters.status !== "all") {
                query = query.eq("status", filters.status);
            }

            // Tag filter
            if (filters.tag && filters.tag !== "all") {
                query = query.eq("tag", filters.tag);
            }

            // Date filters
            if (filters.dateFrom) {
                query = query.gte("created_at", filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte("created_at", filters.dateTo);
            }

            // Sorting
            switch (filters.sortBy) {
                case "oldest":
                    query = query.order("created_at", { ascending: true });
                    break;
                case "total_projects":
                    query = query.order("total_projects", { ascending: false });
                    break;
                case "latest":
                default:
                    query = query.order("created_at", { ascending: false });
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data: data ?? [],
                count: count ?? 0,
                page,
                pageSize,
                totalPages: Math.ceil((count ?? 0) / pageSize),
            };
        },
    });
}

export function useCustomer(id: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: [CUSTOMERS_QUERY_KEY, id],
        queryFn: async (): Promise<CustomerWithStats | null> => {
            const { data, error } = await supabase
                .from("customers_with_stats")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateCustomerInput): Promise<Customer> => {
            const { data, error } = await supabase
                .from("customers")
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Customer created successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to create customer", {
                description: error.message,
            });
        },
    });
}

export function useUpdateCustomer() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data: input,
        }: {
            id: string;
            data: UpdateCustomerInput;
        }): Promise<Customer> => {
            const { data, error } = await supabase
                .from("customers")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
            queryClient.invalidateQueries({
                queryKey: [CUSTOMERS_QUERY_KEY, variables.id],
            });
            toast.success("Customer updated successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to update customer", {
                description: error.message,
            });
        },
    });
}

export function useDeleteCustomer() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            const { error } = await supabase.from("customers").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Customer deleted successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to delete customer", {
                description: error.message,
            });
        },
    });
}
