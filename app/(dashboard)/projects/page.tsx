"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProjects, useDeleteProject } from "@/hooks/use-projects";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "use-debounce";
import { formatDate, formatCurrency, getStatusColor, getPriorityColor, truncateText, stripHtml } from "@/lib/utils";
import type { ProjectFilters } from "@/lib/types";
import {
    Plus,
    Search,
    Download,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    FileText,
    CreditCard,
    X,
    Calendar,
    ChevronDown,
    FileOutput,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfDay, endOfDay, subDays } from "date-fns";

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
import { Skeleton } from "@/components/ui/skeleton";

type DatePreset = "all" | "today" | "week" | "month" | "custom";

function ProjectsList() {
    const searchParams = useSearchParams();
    const customerId = searchParams.get("customer");

    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 300);
    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [customDateFrom, setCustomDateFrom] = useState("");
    const [customDateTo, setCustomDateTo] = useState("");
    const [filters, setFilters] = useState<ProjectFilters>({
        status: "all",
        priority: "all",
        paymentStatus: "all",
        sortBy: "latest",
        customerId: customerId || undefined,
        invoiceNo: "",
    });
    const [page, setPage] = useState(1);
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [debouncedInvoiceSearch] = useDebounce(invoiceSearch, 300);
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
                return {
                    dateFrom: format(subDays(now, 7), "yyyy-MM-dd"),
                    dateTo: format(endOfDay(now), "yyyy-MM-dd"),
                };
            case "month":
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
            invoiceNo: debouncedInvoiceSearch,
            ...dateRange,
        };
    }, [filters, debouncedSearch, debouncedInvoiceSearch, datePreset, getDateRange]);

    const { data, isLoading, error } = useProjects(combinedFilters, page, 10);
    const deleteMutation = useDeleteProject();

    const handleExport = useCallback(async () => {
        if (!data?.data.length) return;

        // 1. Get all project IDs
        const projectIds = data.data.map((p) => p.id);

        // 2. Fetch items for these projects
        const supabase = createClient();
        const { data: allItems } = await supabase
            .from("project_items")
            .select("*")
            .in("project_id", projectIds)
            .order("sort_order", { ascending: true });

        // 3. Group items by project
        const itemsByProject: Record<string, any[]> = {};
        if (allItems) {
            allItems.forEach((item) => {
                if (!itemsByProject[item.project_id]) {
                    itemsByProject[item.project_id] = [];
                }
                itemsByProject[item.project_id].push(item);
            });
        }

        // 4. Transform data for export including all fields
        const exportData = data.data.map((project) => {
            const projectItems = itemsByProject[project.id] || [];
            const itemsString = projectItems
                .map(
                    (item) =>
                        `${item.title} (Qty: ${item.quantity}, Rate: ${item.rate}, Amt: ${item.amount})`
                )
                .join(" | ");

            return {
                "Project ID": project.id,
                "Invoice No": project.invoice_no,
                "Title": project.title,
                "Status": project.status,
                "Priority": project.priority,
                "Start Date": project.start_date ? formatDate(project.start_date) : "",
                "End Date": project.end_date ? formatDate(project.end_date) : "",
                "Total Cost": project.total_cost,
                "Paid Amount": project.paid_amount,
                "Pending Amount": project.pending_amount,
                "Payment Count": project.payment_count,
                "Last Payment Date": project.last_payment_date ? formatDate(project.last_payment_date) : "",
                "Customer Name": project.customer_name || "",
                "Customer Mobile": project.customer_mobile || "",
                "Customer Email": project.customer_email || "",
                "Customer Address": project.customer_address || "",
                "Project By": project.project_by || "",
                "Client Received By": project.client_received_by || "",
                "Details": project.details ? stripHtml(project.details) : "",
                "Project Items": itemsString,
                "Created At": formatDate(project.created_at),
                "Updated At": formatDate(project.updated_at),
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Projects");
        XLSX.writeFile(wb, `projects_${formatDate(new Date(), "yyyy-MM-dd")}.xlsx`);
    }, [data]);

    const handleExportPdf = useCallback(async () => {
        if (!data?.data.length) return;

        try {
            // 1. Get all project IDs
            const projectIds = data.data.map((p) => p.id);

            // 2. Fetch items for these projects
            const supabase = createClient();
            const { data: allItems } = await supabase
                .from("project_items")
                .select("*")
                .in("project_id", projectIds)
                .order("sort_order", { ascending: true });

            // 3. Group items by project
            const itemsByProject: Record<string, any[]> = {};
            if (allItems) {
                allItems.forEach((item) => {
                    if (!itemsByProject[item.project_id]) {
                        itemsByProject[item.project_id] = [];
                    }
                    itemsByProject[item.project_id].push(item);
                });
            }

            const doc = new jsPDF("l", "mm", "a4");

            let fontLoaded = false;
            // Load Bengali Font
            try {
                const fontUrl = "https://cdn.jsdelivr.net/gh/google/fonts/ofl/notosansbengali/NotoSansBengali-Regular.ttf";
                const response = await fetch(fontUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch font: ${response.statusText}`);
                }

                const buffer = await response.arrayBuffer();

                // Safer binary to base64 conversion
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64Font = btoa(binary);

                doc.addFileToVFS("NotoSansBengali-Regular.ttf", base64Font);
                doc.addFont("NotoSansBengali-Regular.ttf", "NotoSansBengali", "normal");
                doc.setFont("NotoSansBengali");
                fontLoaded = true;
            } catch (fontError) {
                console.warn("Failed to load Bengali font, falling back to default:", fontError);
            }

            const tableData = data.data.map((project) => {
                const projectItems = itemsByProject[project.id] || [];
                const itemsString = projectItems
                    .map((item) => `${item.title} (${item.quantity}x${item.rate})`)
                    .join(", ");

                return [
                    project.invoice_no,
                    project.title,
                    project.customer_name || "-",
                    project.status,
                    formatDate(project.start_date),
                    formatDate(project.end_date),
                    formatCurrency(project.total_cost),
                    formatCurrency(project.paid_amount),
                    formatCurrency(project.pending_amount),
                    itemsString,
                ];
            });

            autoTable(doc, {
                head: [
                    [
                        "Inv No",
                        "Title",
                        "Customer",
                        "Status",
                        "Start",
                        "End",
                        "Total",
                        "Paid",
                        "Due",
                        "Items",
                    ],
                ],
                body: tableData,
                styles: {
                    fontSize: 8,
                    overflow: "linebreak",
                    font: fontLoaded ? "NotoSansBengali" : "helvetica",
                    fontStyle: "normal"
                },
                headStyles: { fillColor: [41, 128, 185] },
                columnStyles: {
                    0: { cellWidth: 15 }, // Invoice No
                    1: { cellWidth: 35 }, // Title
                    2: { cellWidth: 30 }, // Customer
                    3: { cellWidth: 20 }, // Status
                    4: { cellWidth: 25 }, // Start
                    5: { cellWidth: 25 }, // End
                    6: { cellWidth: 20 }, // Total
                    7: { cellWidth: 20 }, // Paid
                    8: { cellWidth: 20 }, // Due
                    9: { cellWidth: "auto" }, // Items
                },
            });

            doc.save(`projects_${formatDate(new Date(), "yyyy-MM-dd")}.pdf`);
        } catch (error) {
            console.error("Export failed:", error);
        }
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
            priority: "all",
            paymentStatus: "all",
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
        search ||
        invoiceSearch ||
        filters.status !== "all" ||
        filters.priority !== "all" ||
        filters.paymentStatus !== "all" ||
        datePreset !== "all";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        {customerId ? "Customer projects" : "Manage all your projects"}
                    </p>
                </div>
                <Button asChild>
                    <Link href={customerId ? `/projects/new?customer=${customerId}` : "/projects/new"}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
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
                                placeholder="Search by title or customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="relative w-full max-w-sm lg:w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground text-sm">#</span>
                            </div>
                            <Input
                                placeholder="Invoice No..."
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.status}
                                onValueChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        status: v as ProjectFilters["status"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="ongoing">Ongoing</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.priority}
                                onValueChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        priority: v as ProjectFilters["priority"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priority</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="mid">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.paymentStatus}
                                onValueChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        paymentStatus: v as ProjectFilters["paymentStatus"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="paid">Fully Paid</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.sortBy}
                                onValueChange={(v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        sortBy: v as ProjectFilters["sortBy"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest">Latest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
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

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Excel
                                </Button>
                                <Button variant="outline" onClick={handleExportPdf}>
                                    <FileOutput className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="py-4 text-destructive">
                        Failed to load projects. Please try again.
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Delivery Date</TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-40" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24 ml-auto" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-8 w-8" />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : data?.data.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            <Badge variant="outline">
                                                #{project.invoice_no}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{project.title}</p>
                                                </div>
                                                {project.details && (
                                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                                        {truncateText(stripHtml(project.details), 50)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {project.customer_name ? (
                                                <Link
                                                    href={`/customers/${project.customer_id}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {project.customer_name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={getStatusColor(project.status)}
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
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="space-y-0.5">
                                                <p className="font-medium">
                                                    {formatCurrency(project.total_cost)}
                                                </p>
                                                <p className="text-xs text-emerald-600">
                                                    Paid: {formatCurrency(project.paid_amount)}
                                                </p>
                                                {project.pending_amount > 0 && (
                                                    <p className="text-xs text-amber-600">
                                                        Due: {formatCurrency(project.pending_amount)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {project.start_date ? formatDate(project.start_date) : "-"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {project.end_date ? formatDate(project.end_date) : "-"}
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
                                                        <Link href={`/projects/${project.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/projects/${project.id}/edit`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/projects/${project.id}#payments`}>
                                                            <CreditCard className="mr-2 h-4 w-4" />
                                                            Add Payment
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/projects/${project.id}#invoice`}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Generate Invoice
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteId(project.id)}
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
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="text-muted-foreground">
                                            <p className="text-lg font-medium">No projects found</p>
                                            <p className="text-sm mt-1">
                                                {hasActiveFilters
                                                    ? "Try adjusting your filters"
                                                    : "Get started by creating your first project"}
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
                            {Math.min(page * 10, data.count)} of {data.count} projects
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
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this project? This action cannot
                            be undone and will also delete all associated payments.
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

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectsList />
        </Suspense>
    );
}
