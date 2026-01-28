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
import { format } from "date-fns";
import { DateFilterModal } from "@/components/projects/date-filter-modal";

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

// Removed DatePreset type


function ProjectsList() {
    const searchParams = useSearchParams();
    const customerId = searchParams.get("customer");

    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 300);

    // Removed local datePreset states as they are now managed by filters directly or inside the modal
    const [filters, setFilters] = useState<ProjectFilters>({
        status: "all",
        priority: "all",
        paymentStatus: "all",
        sortBy: "latest",
        customerId: customerId || undefined,
        invoiceNo: "",
        dateField: "created_at",
    });
    const [page, setPage] = useState(1);
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [debouncedInvoiceSearch] = useDebounce(invoiceSearch, 300);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const combinedFilters = useMemo(() => {
        return {
            ...filters,
            search: debouncedSearch,
            invoiceNo: debouncedInvoiceSearch,
        };
    }, [filters, debouncedSearch, debouncedInvoiceSearch]);

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

            // Generate HTML-based PDF with proper Bangla font support
            const projectRows = data.data.map((project) => {
                const projectItems = itemsByProject[project.id] || [];
                const itemsString = projectItems
                    .map((item) => `${item.title} (${item.quantity}x${item.rate})`)
                    .join(", ");

                return `
                    <tr>
                        <td>${project.invoice_no}</td>
                        <td>${project.title}</td>
                        <td>${project.customer_name || "-"}</td>
                        <td><span class="status status-${project.status}">${project.status}</span></td>
                        <td>${project.start_date ? formatDate(project.start_date) : "-"}</td>
                        <td>${project.end_date ? formatDate(project.end_date) : "-"}</td>
                        <td class="amount">${formatCurrency(project.total_cost)}</td>
                        <td class="amount paid">${formatCurrency(project.paid_amount)}</td>
                        <td class="amount due">${formatCurrency(project.pending_amount)}</td>
                        <td class="items">${itemsString || "-"}</td>
                    </tr>
                `;
            }).join("");

            // Calculate totals
            const totalCost = data.data.reduce((sum, p) => sum + p.total_cost, 0);
            const totalPaid = data.data.reduce((sum, p) => sum + p.paid_amount, 0);
            const totalDue = data.data.reduce((sum, p) => sum + p.pending_amount, 0);

            const pdfHtml = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projects Report - ${format(new Date(), "yyyy-MM-dd")}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* A4 Landscape: 297mm x 210mm */
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        
        body {
            font-family: 'Noto Sans Bengali', sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            padding: 10px;
        }
        .report-container {
            width: 277mm; /* A4 landscape width minus margins */
            max-width: 100%;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .header-left h1 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 2px;
        }
        .header-left p {
            color: #666;
            font-size: 9px;
        }
        .header-right {
            text-align: right;
        }
        .header-right .date {
            font-size: 10px;
            font-weight: 600;
        }
        .header-right .count {
            font-size: 9px;
            color: #666;
        }
        
        .table-container {
            width: 100%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            table-layout: fixed;
        }
        th {
            background: #1a1a1a;
            color: #fff;
            padding: 5px 4px;
            text-align: left;
            font-weight: 600;
            font-size: 8px;
        }
        /* Column widths optimized for A4 landscape */
        th:nth-child(1), td:nth-child(1) { width: 6%; } /* Invoice No */
        th:nth-child(2), td:nth-child(2) { width: 14%; } /* Title */
        th:nth-child(3), td:nth-child(3) { width: 12%; } /* Customer */
        th:nth-child(4), td:nth-child(4) { width: 7%; } /* Status */
        th:nth-child(5), td:nth-child(5) { width: 8%; } /* Start */
        th:nth-child(6), td:nth-child(6) { width: 8%; } /* End */
        th:nth-child(7), td:nth-child(7) { width: 9%; } /* Total */
        th:nth-child(8), td:nth-child(8) { width: 9%; } /* Paid */
        th:nth-child(9), td:nth-child(9) { width: 9%; } /* Due */
        th:nth-child(10), td:nth-child(10) { width: 18%; } /* Items */
        
        td {
            padding: 4px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        .amount {
            text-align: right;
            white-space: nowrap;
            font-size: 8px;
        }
        .paid { color: #059669; }
        .due { color: #d97706; }
        
        .status {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 7px;
            font-weight: 600;
            text-transform: capitalize;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-ongoing { background: #dbeafe; color: #1e40af; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-paused { background: #e5e7eb; color: #374151; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-delivered { background: #f3e8ff; color: #6b21a8; }
        
        .items {
            font-size: 7px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.2;
        }
        
        .totals-row {
            background: #f3f4f6 !important;
            font-weight: 700;
        }
        .totals-row td {
            border-top: 1.5px solid #000;
            padding: 6px 4px;
            font-size: 9px;
        }
        
        .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #666;
        }
        
        .print-btn {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #1a1a1a;
            color: #fff;
            padding: 8px 16px;
            border: none;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Noto Sans Bengali', sans-serif;
            border-radius: 4px;
            z-index: 1000;
        }
        .print-btn:hover {
            background: #333;
        }
        
        @media print {
            .print-btn { display: none; }
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                padding: 0;
                font-size: 8px;
            }
            .report-container {
                width: 100%;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            thead {
                display: table-header-group;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF ডাউনলোড</button>
    
    <div class="report-container">
        <div class="header">
            <div class="header-left">
                <h1>প্রিপোর্ট</h1>
                <p>Report</p>
            </div>
            <div class="header-right">
                <div class="date">${format(new Date(), "dd MMM yyyy")}</div>
                <div class="count">মোট প্রজেক্ট: ${data.data.length}</div>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ইনভয়েস নং</th>
                        <th>শিরোনাম</th>
                        <th>গ্রাহক</th>
                        <th>স্ট্যাটাস</th>
                        <th>শুরু</th>
                        <th>শেষ</th>
                        <th style="text-align: right;">মোট</th>
                        <th style="text-align: right;">জমা</th>
                        <th style="text-align: right;">বাকি</th>
                        <th>আইটেম</th>
                    </tr>
                </thead>
                <tbody>
                    ${projectRows}
                    <tr class="totals-row">
                        <td colspan="6" style="text-align: right;"><strong>মোট:</strong></td>
                        <td class="amount">${formatCurrency(totalCost)}</td>
                        <td class="amount paid">${formatCurrency(totalPaid)}</td>
                        <td class="amount due">${formatCurrency(totalDue)}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <div>Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}</div>
            <div>সিয়াম প্রিন্টিং প্রেস</div>
        </div>
    </div>
</body>
</html>
            `;

            // Open in new window for printing
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(pdfHtml);
                printWindow.document.close();
            }
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
        setInvoiceSearch("");
        setFilters({
            status: "all",
            priority: "all",
            paymentStatus: "all",
            sortBy: "latest",
            dateField: "created_at",
            dateFrom: undefined,
            dateTo: undefined,
        });
        setPage(1);
    };

    const hasActiveFilters =
        search ||
        invoiceSearch ||
        filters.status !== "all" ||
        filters.priority !== "all" ||
        filters.paymentStatus !== "all" ||
        filters.dateFrom ||
        filters.dateTo;

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
                <CardContent className="py-1">
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
                    </div>
                </CardContent>
                <CardContent className="py-2">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

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
                                    <SelectItem value="delivered">Delivered</SelectItem>
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
                            {/* Date Filter Modal */}
                            <DateFilterModal
                                filters={filters}
                                onApply={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
                                onClear={() => setFilters((prev) => ({
                                    ...prev,
                                    dateFrom: undefined,
                                    dateTo: undefined,
                                    dateField: "created_at"
                                }))}
                            />

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
                                <TableHead>Created At</TableHead>
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
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell> -- Add extra skeleton cell if needed, but I will just shift things or accept 1 extra col
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
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(project.created_at, "dd MMM yyyy HH:mm")}
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
