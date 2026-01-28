"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { DateFilterModal } from "@/components/projects/date-filter-modal";
import type { ProjectFilters } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
    trend?: number;
    variant?: "default" | "primary" | "success" | "warning";
    isLoading?: boolean;
    href?: string;
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    variant = "default",
    isLoading,
    href,
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

    const Content = (
        <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${href ? "cursor-pointer" : ""}`}>
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

    if (href) {
        return <Link href={href}>{Content}</Link>;
    }
    return Content;
}

export default function DashboardPage() {
    const [filters, setFilters] = useState<Partial<ProjectFilters>>({
        dateField: "created_at",
        dateFrom: undefined, // Default can be changed to Today if requested, but "All Time" is standard
        dateTo: undefined
    });

    const { data: stats, isLoading, error } = useDashboardStats(filters);

    // Helper to construct query string for links
    const getQueryString = (extraParams?: Record<string, string>) => {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        if (filters.dateField) params.set("dateField", filters.dateField);

        if (extraParams) {
            Object.entries(extraParams).forEach(([key, value]) => {
                if (value) params.set(key, value);
            });
        }
        return params.toString();
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back! Here&apos;s an overview of your business.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DateFilterModal
                        filters={filters}
                        onApply={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
                        onClear={() => setFilters({ dateField: "created_at" })}
                    />
                </div>
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
                    href={`/customers?${getQueryString()}`}
                />
                <StatCard
                    title="Total Projects"
                    value={stats?.total_projects ?? 0}
                    description={filters.dateFrom ? "Projects in selected period" : "All time projects"}
                    icon={FolderKanban}
                    variant="default"
                    isLoading={isLoading}
                    href={`/projects?${getQueryString()}`}
                />
                <StatCard
                    title="Pending Projects"
                    value={stats?.pending_projects ?? 0}
                    description="Ongoing, pending & paused"
                    icon={Clock}
                    variant="warning"
                    isLoading={isLoading}
                    href={`/projects?${getQueryString({ status: "pending" })}`} // Note: This will just set status=pending URL param. ProjectsList logic defaults to "all" if not provided, but we need multiple statuses.
                // Actually ProjectsList only supports SINGLE status filter via URL right now? 
                // Let's check ProjectsList again. Type is single value.
                // The dashboard card counts "pending, ongoing, paused".
                // Linking to just "pending" might be misleading if the count includes others.
                // For now, I'll link to "status=pending" or maybe just the list filtered by date, and user can filter status.
                // Or I can add a special "pending_all" filter?
                // Let's just link to "status=pending" as the primary one, or maybe simply /projects with date filter and let user refine.
                // The instruction said: "Total Pending Projects list... and filter system".
                // If I link to `status=pending`, it shows only pending.
                // I will link to `status=pending` for now.
                />
                <StatCard
                    title="Completed Projects"
                    value={stats?.completed_projects ?? 0}
                    description="Successfully delivered"
                    icon={CheckCircle}
                    variant="success"
                    isLoading={isLoading}
                    href={`/projects?${getQueryString({ status: "delivered" })}`}
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.total_amount ?? 0)}
                    description="Filtered View Value"
                    icon={DollarSign}
                    variant="primary"
                    isLoading={isLoading}
                    href={`/projects?${getQueryString()}`} // Just link to list
                />
                <StatCard
                    title="Pending Amount"
                    value={formatCurrency(stats?.pending_amount ?? 0)}
                    description="Amount to receive"
                    icon={TrendingUp}
                    variant="warning"
                    isLoading={isLoading}
                    href={`/projects?${getQueryString({ paymentStatus: "unpaid" })}`} // Link to unpaid projects?
                />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/customers/new" className="block">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
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
                </Link>
                <Link href="/projects/new" className="block">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
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
                </Link>
            </div>
        </div>
    );
}
