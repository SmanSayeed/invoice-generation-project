"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useCustomers, useDeleteCustomer } from "@/hooks/use-customers";
import { useDebounce } from "use-debounce";
import { formatDate, getInitials } from "@/lib/utils";
import type { CustomerFilters } from "@/lib/types";
import {
    Plus,
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    FolderPlus,
    X,
    Calendar,
    ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type DatePreset = "all" | "today" | "week" | "month" | "custom";

export default function CustomersPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 300);
    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [customDateFrom, setCustomDateFrom] = useState("");
    const [customDateTo, setCustomDateTo] = useState("");
    const [filters, setFilters] = useState<CustomerFilters>({
        status: "all",
        tag: "all",
        sortBy: "latest",
    });
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Calculate date range based on preset
    const getDateRange = useCallback((preset: DatePreset) => {
        const now = new Date();
        switch (preset) {
            case "today":
                return {
                    dateFrom: format(startOfDay(now), "yyyy-MM-dd"),
                    dateTo: format(endOfDay(now), "yyyy-MM-dd"),
                };
            case "week":
                // Last 7 days
                return {
                    dateFrom: format(subDays(now, 7), "yyyy-MM-dd"),
                    dateTo: format(endOfDay(now), "yyyy-MM-dd"),
                };
            case "month":
                // Last 30 days
                return {
                    dateFrom: format(subDays(now, 30), "yyyy-MM-dd"),
                    dateTo: format(endOfDay(now), "yyyy-MM-dd"),
                };
            case "custom":
                return {
                    dateFrom: customDateFrom || undefined,
                    dateTo: customDateTo || undefined,
                };
            default:
                return { dateFrom: undefined, dateTo: undefined };
        }
    }, [customDateFrom, customDateTo]);

    const combinedFilters = useMemo(() => {
        const dateRange = getDateRange(datePreset);
        return {
            ...filters,
            search: debouncedSearch,
            ...dateRange,
        };
    }, [filters, debouncedSearch, datePreset, getDateRange]);

    const { data, isLoading, error } = useCustomers(combinedFilters, page, 10);
    const deleteMutation = useDeleteCustomer();

    const handleExport = useCallback(() => {
        if (!data?.data.length) return;

        const exportData = data.data.map((customer) => ({
            Name: customer.name,
            Mobile: customer.mobile,
            Email: customer.email || "",
            Address: customer.address || "",
            Status: customer.status,
            Tag: customer.tag,
            "Added By": customer.added_by || "",
            "Referred By": customer.referred_by || "",
            "Total Projects": customer.total_projects,
            "Running Projects": customer.running_projects,
            "Completed Projects": customer.completed_projects,
            "Created At": formatDate(customer.created_at),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Customers");
        XLSX.writeFile(wb, `customers_${formatDate(new Date(), "yyyy-MM-dd")}.xlsx`);
    }, [data]);

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteMutation.mutateAsync(deleteId);
        setDeleteId(null);
    };

    const clearFilters = () => {
        setSearch("");
        setDatePreset("all");
        setCustomDateFrom("");
        setCustomDateTo("");
        setFilters({
            status: "all",
            tag: "all",
            sortBy: "latest",
        });
        setPage(1);
    };

    const getDatePresetLabel = (preset: DatePreset) => {
        switch (preset) {
            case "today": return "Today";
            case "week": return "Last 7 Days";
            case "month": return "Last 30 Days";
            case "custom": return customDateFrom || customDateTo ? `${customDateFrom || "..."} - ${customDateTo || "..."}` : "Custom Range";
            default: return "All Time";
        }
    };

    const hasActiveFilters =
        search || filters.status !== "all" || filters.tag !== "all" || datePreset !== "all";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your customer database
                    </p>
                </div>
                <Button asChild>
                    <Link href="/customers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, mobile, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.status}
                                onValueChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        status: v as CustomerFilters["status"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.tag}
                                onValueChange={(v) =>
                                    setFilters((f) => ({ ...f, tag: v as CustomerFilters["tag"] }))
                                }
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Tag" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tags</SelectItem>
                                    <SelectItem value="special">Special</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.sortBy}
                                onValueChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        sortBy: v as CustomerFilters["sortBy"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest">Latest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="total_projects">Most Projects</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date Filter */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="min-w-[140px] justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-sm">{getDatePresetLabel(datePreset)}</span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="start">
                                    <div className="p-2 space-y-1">
                                        <Button
                                            variant={datePreset === "all" ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                            onClick={() => setDatePreset("all")}
                                        >
                                            All Time
                                        </Button>
                                        <Button
                                            variant={datePreset === "today" ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                            onClick={() => setDatePreset("today")}
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant={datePreset === "week" ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                            onClick={() => setDatePreset("week")}
                                        >
                                            Last 7 Days
                                        </Button>
                                        <Button
                                            variant={datePreset === "month" ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                            onClick={() => setDatePreset("month")}
                                        >
                                            Last 30 Days
                                        </Button>
                                    </div>
                                    <div className="border-t p-2">
                                        <p className="text-xs text-muted-foreground mb-2">Custom Range</p>
                                        <div className="space-y-2">
                                            <Input
                                                type="date"
                                                placeholder="From"
                                                value={customDateFrom}
                                                onChange={(e) => {
                                                    setCustomDateFrom(e.target.value);
                                                    setDatePreset("custom");
                                                }}
                                            />
                                            <Input
                                                type="date"
                                                placeholder="To"
                                                value={customDateTo}
                                                onChange={(e) => {
                                                    setCustomDateTo(e.target.value);
                                                    setDatePreset("custom");
                                                }}
                                            />
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {hasActiveFilters && (
                                <Button variant="ghost" size="icon" onClick={clearFilters}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}

                            <Button variant="outline" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="py-4 text-destructive">
                        Failed to load customers. Please try again.
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Tag</TableHead>
                                <TableHead className="text-center">Projects</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-16" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Skeleton className="h-4 w-8 mx-auto" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-8 w-8" />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : data?.data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                                                        {getInitials(customer.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{customer.name}</p>
                                                    {customer.address && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {customer.address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-sm">{customer.mobile}</p>
                                                {customer.email && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {customer.email}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    customer.tag === "special" ? "default" : "secondary"
                                                }
                                            >
                                                {customer.tag}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm">
                                                <span className="font-medium">
                                                    {customer.total_projects}
                                                </span>
                                                {customer.running_projects > 0 && (
                                                    <span className="text-muted-foreground">
                                                        ({customer.running_projects} active)
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(customer.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/customers/${customer.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/customers/${customer.id}/edit`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/projects/new?customer=${customer.id}`}>
                                                            <FolderPlus className="mr-2 h-4 w-4" />
                                                            New Project
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteId(customer.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {!isLoading && data?.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="text-muted-foreground">
                                            <p className="text-lg font-medium">No customers found</p>
                                            <p className="text-sm mt-1">
                                                {hasActiveFilters
                                                    ? "Try adjusting your filters"
                                                    : "Get started by adding your first customer"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing {(page - 1) * 10 + 1} to{" "}
                            {Math.min(page * 10, data.count)} of {data.count} customers
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this customer? This action cannot
                            be undone and will also delete all associated projects.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
