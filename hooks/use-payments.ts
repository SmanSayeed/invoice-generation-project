"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Payment, CreatePaymentInput, UpdatePaymentInput } from "@/lib/types";
import { toast } from "sonner";

const PAYMENTS_QUERY_KEY = "payments";

export function usePayments(projectId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: [PAYMENTS_QUERY_KEY, projectId],
        queryFn: async (): Promise<Payment[]> => {
            const { data, error } = await supabase
                .from("payments")
                .select("*")
                .eq("project_id", projectId)
                .order("payment_date", { ascending: false });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!projectId,
    });
}

export function useCreatePayment() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreatePaymentInput): Promise<Payment> => {
            const { data, error } = await supabase
                .from("payments")
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [PAYMENTS_QUERY_KEY, variables.project_id],
            });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Payment recorded successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to record payment", {
                description: error.message,
            });
        },
    });
}

export function useUpdatePayment() {
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
            data: UpdatePaymentInput;
        }): Promise<Payment> => {
            const { data, error } = await supabase
                .from("payments")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [PAYMENTS_QUERY_KEY, variables.projectId],
            });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Payment updated successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to update payment", {
                description: error.message,
            });
        },
    });
}

export function useDeletePayment() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            projectId,
        }: {
            id: string;
            projectId: string;
        }): Promise<void> => {
            const { error } = await supabase.from("payments").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [PAYMENTS_QUERY_KEY, variables.projectId],
            });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast.success("Payment deleted successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to delete payment", {
                description: error.message,
            });
        },
    });
}
