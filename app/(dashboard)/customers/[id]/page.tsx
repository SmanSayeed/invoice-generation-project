"use client";

import { use } from "react";
import Link from "next/link";
import { useCustomer } from "@/hooks/use-customers";
import { useCustomerProjects } from "@/hooks/use-projects";
import { formatDate, formatCurrency, getInitials, getStatusColor, getPriorityColor } from "@/lib/utils";
import {
    ArrowLeft,
    Pencil,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FolderKanban,
    Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data: customer, isLoading: customerLoading } = useCustomer(id);
    const { data: projects, isLoading: projectsLoading } = useCustomerProjects(id);

    if (customerLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Customer not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/customers">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-lg">
                            {getInitials(customer.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={customer.tag === "special" ? "default" : "secondary"}>
                                {customer.tag}
                            </Badge>
                            <Badge
                                variant={customer.status === "active" ? "default" : "secondary"}
                                className={
                                    customer.status === "active"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : ""
                                }
                            >
                                {customer.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/customers/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/projects/new?customer=${id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Mobile</p>
                                <p className="font-medium">{customer.mobile}</p>
                            </div>
                        </div>

                        {customer.email && (
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{customer.email}</p>
                                </div>
                            </div>
                        )}

                        {customer.address && (
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="font-medium">{customer.address}</p>
                                </div>
                            </div>
                        )}

                        <Separator />

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Added on</p>
                                <p className="font-medium">{formatDate(customer.created_at)}</p>
                            </div>
                        </div>

                        {customer.added_by && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Added by: </span>
                                <span>{customer.added_by}</span>
                            </div>
                        )}
                        {customer.referred_by && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Referred by: </span>
                                <span>{customer.referred_by}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    {customer.total_projects}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Total</p>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {customer.running_projects}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Active</p>
                            </div>
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {customer.completed_projects}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Done</p>
                            </div>
                        </div>

                        {customer.details && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <p className="text-sm font-medium mb-2">Notes</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {customer.details}
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Projects List */}
                <Card className="lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg">Projects</CardTitle>
                            <CardDescription>Recent projects for this customer</CardDescription>
                        </div>
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {projectsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        ) : projects?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No projects yet</p>
                                <Button variant="link" asChild className="mt-2">
                                    <Link href={`/projects/new?customer=${id}`}>
                                        Create first project
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {projects?.slice(0, 5).map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{project.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-xs ${getStatusColor(project.status)}`}
                                                    >
                                                        {project.status}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${getPriorityColor(project.priority)}`}
                                                    >
                                                        {project.priority}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm">
                                                <p className="font-medium">
                                                    {formatCurrency(project.total_cost)}
                                                </p>
                                                {project.pending_amount > 0 && (
                                                    <p className="text-xs text-amber-600">
                                                        Due: {formatCurrency(project.pending_amount)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {projects && projects.length > 5 && (
                                    <Button variant="ghost" className="w-full" asChild>
                                        <Link href={`/projects?customer=${id}`}>
                                            View all {projects.length} projects
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
