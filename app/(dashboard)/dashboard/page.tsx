"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DashboardSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
    Users,
    FolderKanban,
    Clock,
    CheckCircle,
    DollarSign,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function useDashboardStats() {
    const supabase = createClient();

    return useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async (): Promise<DashboardSummary> => {
            const { data, error } = await supabase
                .from("dashboard_summary")
                .select("*")
                .single();

            if (error) throw error;
            return data;
        },
    });
}

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
    trend?: number;
    variant?: "default" | "primary" | "success" | "warning";
    isLoading?: boolean;
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    variant = "default",
    isLoading,
}: StatCardProps) {
    const variants = {
        default: "from-slate-500 to-slate-600",
        primary: "from-violet-500 to-purple-600",
        success: "from-emerald-500 to-green-600",
        warning: "from-amber-500 to-orange-600",
    };

    if (isLoading) {
        return (
            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-violet-500 to-purple-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${variants[variant]} shadow-md`}
                >
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { data: stats, isLoading, error } = useDashboardStats();

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here&apos;s an overview of your business.
                </p>
            </div>

            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="py-4">
                        <p className="text-destructive">
                            Failed to load dashboard stats. Please check your database connection.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Customers"
                    value={stats?.total_customers ?? 0}
                    description="Registered customers"
                    icon={Users}
                    variant="primary"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Projects"
                    value={stats?.total_projects ?? 0}
                    description="All time projects"
                    icon={FolderKanban}
                    variant="default"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Pending Projects"
                    value={stats?.pending_projects ?? 0}
                    description="Ongoing, pending & paused"
                    icon={Clock}
                    variant="warning"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Completed Projects"
                    value={stats?.completed_projects ?? 0}
                    description="Successfully delivered"
                    icon={CheckCircle}
                    variant="success"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.total_amount ?? 0)}
                    description="All project value"
                    icon={DollarSign}
                    variant="primary"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Pending Amount"
                    value={formatCurrency(stats?.pending_amount ?? 0)}
                    description="Amount to receive"
                    icon={TrendingUp}
                    variant="warning"
                    isLoading={isLoading}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="font-medium">Add Customer</p>
                            <p className="text-sm text-muted-foreground">Create new customer</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <FolderKanban className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-medium">Add Project</p>
                            <p className="text-sm text-muted-foreground">Start new project</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
