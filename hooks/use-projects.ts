"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
    Project,
    ProjectWithDetails,
    CreateProjectInput,
    UpdateProjectInput,
    ProjectFilters,
    PaginatedResponse,
} from "@/lib/types";
import { toast } from "sonner";

const PROJECTS_QUERY_KEY = "projects";

export function useProjects(
    filters: ProjectFilters = {},
    page: number = 1,
    pageSize: number = 10
) {
    const supabase = createClient();

    return useQuery({
        queryKey: [PROJECTS_QUERY_KEY, filters, page, pageSize],
        queryFn: async (): Promise<PaginatedResponse<ProjectWithDetails>> => {
            let query = supabase
                .from("projects_with_details")
                .select("*", { count: "exact" });

            // Search filter
            if (filters.search) {
                query = query.or(
                    `title.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`
                );
            }

            // Status filter
            if (filters.status && filters.status !== "all") {
                query = query.eq("status", filters.status);
            }

            // Priority filter
            if (filters.priority && filters.priority !== "all") {
                query = query.eq("priority", filters.priority);
            }

            // Customer filter
            if (filters.customerId) {
                query = query.eq("customer_id", filters.customerId);
            }

            // Payment status filter
            if (filters.paymentStatus === "paid") {
                query = query.eq("pending_amount", 0);
            } else if (filters.paymentStatus === "unpaid") {
                query = query.gt("pending_amount", 0);
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

export function useProject(id: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: [PROJECTS_QUERY_KEY, id],
        queryFn: async (): Promise<ProjectWithDetails | null> => {
            const { data, error } = await supabase
                .from("projects_with_details")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}

export function useCustomerProjects(customerId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: [PROJECTS_QUERY_KEY, "customer", customerId],
        queryFn: async (): Promise<ProjectWithDetails[]> => {
            const { data, error } = await supabase
                .from("projects_with_details")
                .select("*")
                .eq("customer_id", customerId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!customerId,
    });
}

export function useCreateProject() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateProjectInput): Promise<Project> => {
            const { data, error } = await supabase
                .from("projects")
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Project created successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to create project", {
                description: error.message,
            });
        },
    });
}

export function useUpdateProject() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data: input,
        }: {
            id: string;
            data: UpdateProjectInput;
        }): Promise<Project> => {
            const { data, error } = await supabase
                .from("projects")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
            queryClient.invalidateQueries({
                queryKey: [PROJECTS_QUERY_KEY, variables.id],
            });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Project updated successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to update project", {
                description: error.message,
            });
        },
    });
}

export function useDeleteProject() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            const { error } = await supabase.from("projects").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Project deleted successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to delete project", {
                description: error.message,
            });
        },
    });
}
