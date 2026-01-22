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

            // Invoice number filter
            if (filters.invoiceNo) {
                // Cast invoice_no to text for partial matching
                // Note: This relies on PostgREST syntax for casting
                query = query.filter("invoice_no::text", "ilike", `%${filters.invoiceNo}%`);
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
            const { data: project, error: projectError } = await supabase
                .from("projects_with_details")
                .select("*")
                .eq("id", id)
                .single();

            if (projectError) throw projectError;
            if (!project) return null;

            // Fetch items
            const { data: items, error: itemsError } = await supabase
                .from("project_items")
                .select("*")
                .eq("project_id", id)
                .order("sort_order", { ascending: true });

            if (itemsError) throw itemsError;

            return {
                ...project,
                items: items ?? [],
            };
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
            const { items, ...projectData } = input;

            // 1. Create the project
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .insert(projectData)
                .select()
                .single();

            if (projectError) throw projectError;

            // 2. Create items if any
            if (items && items.length > 0) {
                const itemsWithProjectId = items.map((item) => ({
                    ...item,
                    project_id: project.id,
                }));

                const { error: itemsError } = await supabase
                    .from("project_items")
                    .insert(itemsWithProjectId);

                if (itemsError) throw itemsError;
            }

            return project;
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
            const { items, ...projectData } = input;

            // 1. Update project metadata
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .update(projectData)
                .eq("id", id)
                .select()
                .single();

            if (projectError) throw projectError;

            // 2. Handle items if provided
            if (items) {
                // Get current items to find which ones to delete
                const { data: existingItems } = await supabase
                    .from("project_items")
                    .select("id")
                    .eq("project_id", id);

                const newItemIds = items
                    .filter((item) => "id" in item && item.id)
                    .map((item) => (item as any).id);

                // Delete items that are no longer present
                if (existingItems && existingItems.length > 0) {
                    const toDelete = existingItems
                        .filter((item) => !newItemIds.includes(item.id))
                        .map((item) => item.id);

                    if (toDelete.length > 0) {
                        const { error: deleteError } = await supabase
                            .from("project_items")
                            .delete()
                            .in("id", toDelete);
                        if (deleteError) throw deleteError;
                    }
                }

                // Upsert remaining/new items
                if (items.length > 0) {
                    const itemsToUpsert = items.map((item, index) => ({
                        ...item,
                        project_id: id,
                        sort_order: (item as any).sort_order ?? index,
                    }));

                    const { error: itemsError } = await supabase
                        .from("project_items")
                        .upsert(itemsToUpsert);

                    if (itemsError) throw itemsError;
                }
            }

            return project;
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
