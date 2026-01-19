"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { usePayments, useCreatePayment, useDeletePayment } from "@/hooks/use-payments";
import {
    formatDate,
    formatCurrency,
    getStatusColor,
    getPriorityColor,
    stripHtml,
    toBanglaNumber,
} from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
    ArrowLeft,
    Pencil,
    Calendar,
    User,
    CreditCard,
    Plus,
    Trash2,
    FileText,
    Download,
    Loader2,
    DollarSign,
    CalendarIcon,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const paymentSchema = z.object({
    amount: z.any().refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        { message: "Amount must be a positive number" }
    ),
    payment_date: z.date(),
    note: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data: project, isLoading: projectLoading } = useProject(id);
    const { data: payments, isLoading: paymentsLoading } = usePayments(id);
    const createPaymentMutation = useCreatePayment();
    const deletePaymentMutation = useDeletePayment();

    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: 0,
            payment_date: new Date(),
            note: "",
        },
    });

    async function onPaymentSubmit(data: PaymentFormValues) {
        await createPaymentMutation.mutateAsync({
            project_id: id,
            amount: Number(data.amount),
            payment_date: format(data.payment_date, "yyyy-MM-dd"),
            note: data.note,
        });
        setPaymentDialogOpen(false);
        form.reset({
            amount: 0,
            payment_date: new Date(),
            note: "",
        });
    }

    async function handleDeletePayment() {
        if (!deletePaymentId) return;
        await deletePaymentMutation.mutateAsync({
            id: deletePaymentId,
            projectId: id,
        });
        setDeletePaymentId(null);
    }

    const generateInvoicePdf = async () => {
        if (!project) return;
        setIsGeneratingPdf(true);

        // Generate HTML invoice that opens in a new window for printing
        // This approach properly supports Bengali fonts using Google Fonts
        const invoiceHtml = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - INV-${project.invoice_no}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Noto Sans Bengali', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #7c3aed;
        }
        .title {
            font-size: 32px;
            font-weight: 700;
            color: #7c3aed;
        }
        .invoice-no {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
        }
        .date {
            text-align: right;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #7c3aed;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        .label {
            width: 150px;
            color: #666;
            font-weight: 500;
        }
        .value {
            flex: 1;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 30px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            width: 250px;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .total-row:last-child {
            border-bottom: 2px solid #7c3aed;
        }
        .total-label {
            color: #666;
        }
        .total-value {
            font-weight: 600;
            color: #333;
        }
        .due-amount {
            color: #dc2626;
            font-weight: 700;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #7c3aed;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .print-btn:hover {
            background: #6d28d9;
        }
        @media print {
            .print-btn {
                display: none;
            }
            body {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF ডাউনলোড</button>
    
    <div class="header">
        <div>
            <div class="title">ইনভয়েস</div>
            <div class="invoice-no">ইনভয়েস নং: INV-${project.invoice_no}</div>
        </div>
        <div class="date">
            <strong>তারিখ:</strong> ${formatDate(new Date(), "dd/MM/yyyy")}
        </div>
    </div>

    <div class="section">
        <div class="section-title">গ্রাহকের তথ্য</div>
        <div class="info-row">
            <span class="label">গ্রাহকের নাম:</span>
            <span class="value">${project.customer_name || "-"}</span>
        </div>
        <div class="info-row">
            <span class="label">মোবাইল:</span>
            <span class="value">${project.customer_mobile || "-"}</span>
        </div>
        ${project.customer_address ? `
        <div class="info-row">
            <span class="label">ঠিকানা:</span>
            <span class="value">${project.customer_address}</span>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <div class="section-title">প্রকল্পের তথ্য</div>
        <div class="info-row">
            <span class="label">প্রকল্পের শিরোনাম:</span>
            <span class="value">${project.title}</span>
        </div>
        <div class="info-row">
            <span class="label">স্ট্যাটাস:</span>
            <span class="value">${project.status}</span>
        </div>
        ${project.client_received_by ? `
        <div class="info-row">
            <span class="label">প্রাপ্তি সাইন করেছেন:</span>
            <span class="value">${project.client_received_by}</span>
        </div>
        ` : ''}
        ${project.details ? `
        <div class="info-row">
            <span class="label">বিবরণ:</span>
            <span class="value">${stripHtml(project.details)}</span>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <div class="section-title">পেমেন্ট হিস্টরি</div>
        <table>
            <thead>
                <tr>
                    <th>তারিখ</th>
                    <th>নোট</th>
                    <th class="text-right">পরিমাণ</th>
                </tr>
            </thead>
            <tbody>
                ${payments?.length ? payments.map(payment => `
                <tr>
                    <td>${formatDate(payment.payment_date, "dd/MM/yyyy")}</td>
                    <td>${payment.note || "-"}</td>
                    <td class="text-right">৳${payment.amount.toFixed(2)}</td>
                </tr>
                `).join('') : '<tr><td colspan="3" style="text-align:center;color:#999;">কোন পেমেন্ট নেই</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="totals">
        <div class="total-row">
            <span class="total-label">মোট মূল্য:</span>
            <span class="total-value">৳${project.total_cost.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span class="total-label">প্রদত্ত:</span>
            <span class="total-value">৳${project.paid_amount.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span class="total-label">বকেয়া:</span>
            <span class="total-value due-amount">৳${project.pending_amount.toFixed(2)}</span>
        </div>
    </div>

    <div class="footer">
        এই ইনভয়েসটি স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে
    </div>
</body>
</html>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(invoiceHtml);
            printWindow.document.close();
        }

        setIsGeneratingPdf(false);
    };

    if (projectLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <Skeleton className="h-64 lg:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/projects">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Project not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const paymentProgress =
        project.total_cost > 0
            ? (project.paid_amount / project.total_cost) * 100
            : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/projects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {project.title}
                            </h1>
                            <Badge variant="outline">#{project.invoice_no}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge
                                variant="secondary"
                                className={getStatusColor(project.status)}
                            >
                                {project.status}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={getPriorityColor(project.priority)}
                            >
                                {project.priority} priority
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/projects/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        onClick={generateInvoicePdf}
                        disabled={isGeneratingPdf}
                        id="invoice"
                    >
                        {isGeneratingPdf ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Invoice
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Details */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Customer</p>
                                <Link
                                    href={`/customers/${project.customer_id}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {project.customer_name || "Unknown"}
                                </Link>
                                {project.customer_mobile && (
                                    <p className="text-sm text-muted-foreground">
                                        {project.customer_mobile}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Dates */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Start Date</p>
                                    <p className="font-medium">
                                        {project.start_date
                                            ? formatDate(project.start_date)
                                            : "Not set"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">End Date</p>
                                    <p className="font-medium">
                                        {project.end_date ? formatDate(project.end_date) : "Not set"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Amounts */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                    Payment Progress
                                </span>
                                <span className="text-sm font-medium">
                                    {paymentProgress.toFixed(0)}%
                                </span>
                            </div>
                            <Progress value={paymentProgress} className="h-2" />
                            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">
                                        {formatCurrency(project.total_cost)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(project.paid_amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Paid</p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {formatCurrency(project.pending_amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Due</p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(project.project_by || project.client_received_by) && (
                            <>
                                <Separator />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {project.project_by && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Project By</p>
                                            <p className="font-medium">{project.project_by}</p>
                                        </div>
                                    )}
                                    {project.client_received_by && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Client Received By
                                            </p>
                                            <p className="font-medium">{project.client_received_by}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Details */}
                        {project.details && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium mb-2">Description</p>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: project.details }}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Payments */}
                <Card id="payments">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg">Payments</CardTitle>
                            <CardDescription>
                                {payments?.length || 0} payment(s) recorded
                            </CardDescription>
                        </div>
                        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Payment</DialogTitle>
                                    <DialogDescription>
                                        Record a new payment for this project
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onPaymentSubmit)}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amount (৳)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payment_date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <CalendarUI
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="note"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Note (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Payment milestone or description..."
                                                            className="resize-none"
                                                            rows={2}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={createPaymentMutation.isPending}
                                            >
                                                {createPaymentMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Save Payment"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {paymentsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : payments?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No payments recorded</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {payments?.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-start justify-between p-3 rounded-lg border"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {formatCurrency(payment.amount)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(payment.payment_date)}
                                                </p>
                                                {payment.note && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {payment.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeletePaymentId(payment.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Payment Dialog */}
            <AlertDialog
                open={!!deletePaymentId}
                onOpenChange={() => setDeletePaymentId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this payment? This will update the
                            project&apos;s paid amount.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePayment}
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
