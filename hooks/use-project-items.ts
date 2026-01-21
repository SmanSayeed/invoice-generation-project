"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
    ProjectItem,
    CreateProjectItemInput,
    UpdateProjectItemInput,
} from "@/lib/types";
import { toast } from "sonner";

const PROJECT_ITEMS_QUERY_KEY = "project-items";

export function useProjectItems(projectId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: [PROJECT_ITEMS_QUERY_KEY, projectId],
        queryFn: async (): Promise<ProjectItem[]> => {
            const { data, error } = await supabase
                .from("project_items")
                .select("*")
                .eq("project_id", projectId)
                .order("sort_order", { ascending: true });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!projectId,
    });
}

export function useCreateProjectItem() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateProjectItemInput & { project_id: string }): Promise<ProjectItem> => {
            const { data, error } = await supabase
                .from("project_items")
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [PROJECT_ITEMS_QUERY_KEY, variables.project_id] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast.success("আইটেম যোগ হয়েছে");
        },
        onError: (error: Error) => {
            toast.error("আইটেম যোগ করতে ব্যর্থ", {
                description: error.message,
            });
        },
    });
}

export function useCreateProjectItems() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (items: (CreateProjectItemInput & { project_id: string })[]): Promise<ProjectItem[]> => {
            if (items.length === 0) return [];

            const { data, error } = await supabase
                .from("project_items")
                .insert(items)
                .select();

            if (error) throw error;
            return data ?? [];
        },
        onSuccess: (_, variables) => {
            if (variables.length > 0) {
                queryClient.invalidateQueries({ queryKey: [PROJECT_ITEMS_QUERY_KEY, variables[0].project_id] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
            }
        },
        onError: (error: Error) => {
            toast.error("আইটেম যোগ করতে ব্যর্থ", {
                description: error.message,
            });
        },
    });
}

export function useUpdateProjectItem() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            projectId,
            data: input,
        }: {
            id: string;
            projectId: string;
            data: UpdateProjectItemInput;
        }): Promise<ProjectItem> => {
            const { data, error } = await supabase
                .from("project_items")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [PROJECT_ITEMS_QUERY_KEY, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast.success("আইটেম আপডেট হয়েছে");
        },
        onError: (error: Error) => {
            toast.error("আইটেম আপডেট করতে ব্যর্থ", {
                description: error.message,
            });
        },
    });
}

export function useDeleteProjectItem() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, projectId }: { id: string; projectId: string }): Promise<void> => {
            const { error } = await supabase.from("project_items").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [PROJECT_ITEMS_QUERY_KEY, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast.success("আইটেম মুছে ফেলা হয়েছে");
        },
        onError: (error: Error) => {
            toast.error("আইটেম মুছতে ব্যর্থ", {
                description: error.message,
            });
        },
    });
}

export function useDeleteProjectItems() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ids, projectId }: { ids: string[]; projectId: string }): Promise<void> => {
            if (ids.length === 0) return;

            const { error } = await supabase
                .from("project_items")
                .delete()
                .in("id", ids);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [PROJECT_ITEMS_QUERY_KEY, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
        onError: (error: Error) => {
            toast.error("আইটেম মুছতে ব্যর্থ", {
                description: error.message,
            });
        },
    });
}
