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

    // Helper function to convert number to Bengali words
    const numberToWords = (num: number): string => {
        if (num === 0) return 'শূন্য';

        const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
            'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ',
            'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'উনত্রিশ',
            'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ',
            'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ',
            'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট',
            'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর',
            'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'উনআশি',
            'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'উননব্বই',
            'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

        const n = Math.floor(num);
        if (n < 100) return ones[n] || n.toString();

        const lakh = Math.floor(n / 100000);
        const thousand = Math.floor((n % 100000) / 1000);
        const hundred = Math.floor((n % 1000) / 100);
        const rest = n % 100;

        let result = '';
        if (lakh > 0) result += ones[lakh] + ' লক্ষ ';
        if (thousand > 0) result += ones[thousand] + ' হাজার ';
        if (hundred > 0) result += ones[hundred] + ' শত ';
        if (rest > 0) result += ones[rest];

        return result.trim() || n.toString();
    };

    const generateInvoicePdf = async () => {
        if (!project) return;
        setIsGeneratingPdf(true);

        // Generate HTML invoice that opens in a new window for printing
        // Professional black & white memo design
        const invoiceHtml = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ক্যাশ মেমো - ${project.invoice_no}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans Bengali', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
        }
        .memo {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15px 20px;
            position: relative;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .logo-area {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .logo-area img {
            height: 60px;
            object-fit: contain;
        }
        .company-name {
            font-size: 22px;
            font-weight: 700;
        }
        .company-name-en {
            font-size: 12px;
            font-weight: 500;
            color: #333;
        }
        .memo-title {
            text-align: right;
        }
        .memo-badge {
            font-size: 20px;
            font-weight: 700;
            border: 2px solid #000;
            padding: 5px 15px;
            display: inline-block;
        }
        .owner-info {
            margin-top: 8px;
            font-size: 11px;
            text-align: right;
        }
        .owner-name {
            font-weight: 600;
        }
        
        /* Info Fields */
        .info-fields {
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            border-bottom: 1px solid #ccc;
            padding: 6px 0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            width: 100px;
            font-weight: 600;
        }
        .info-value {
            flex: 1;
            min-height: 18px;
        }
        .info-row.two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .info-col {
            display: flex;
        }
        
        /* Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .items-table th {
            background: #000;
            color: #fff;
            padding: 10px 8px;
            font-weight: 600;
            text-align: left;
        }
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:last-child {
            text-align: center;
            width: 80px;
        }
        .items-table th:first-child {
            width: 50%;
        }
        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
        }
        .items-table td:nth-child(3),
        .items-table td:nth-child(4),
        .items-table td:last-child {
            text-align: center;
        }
        .items-table tbody tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        /* Kothay (Words) Section */
        .kothay-section {
            background: #f0f0f0;
            padding: 8px 12px;
            margin-bottom: 20px;
            border-left: 3px solid #000;
        }
        .kothay-label {
            font-weight: 600;
        }
        
        /* Totals */
        .totals-area {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        .totals-box {
            width: 200px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
        }
        .totals-row:last-child {
            border-bottom: 2px solid #000;
            font-weight: 700;
            font-size: 14px;
        }
        
        /* Signatures */
        .signatures {
            display: flex;
            justify-content: space-between;
            margin: 50px 0 30px;
            padding-top: 20px;
        }
        .sig-box {
            text-align: center;
            min-width: 150px;
        }
        .sig-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 11px;
        }
        .sig-center {
            text-align: center;
            flex: 1;
        }
        
        /* Footer */
        .footer {
            background: #1a1a1a;
            color: #fff;
            font-size: 11px;
            margin-top: 20px;
        }
        .footer-address {
            background: #c41e3a;
            padding: 8px 20px;
            text-align: center;
            font-weight: 500;
        }
        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
        }
        .footer-left {
            display: flex;
            gap: 20px;
        }
        .footer-right {
            text-align: right;
        }
        .footer-tagline {
            font-weight: 600;
            font-size: 12px;
        }
        .footer-sub {
            font-size: 10px;
            color: #ccc;
        }
        
        /* Print */
        .print-btn {
            position: fixed;
            top: 15px;
            right: 15px;
            background: #000;
            color: #fff;
            padding: 10px 20px;
            border: none;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Noto Sans Bengali', sans-serif;
        }
        @media print {
            .print-btn { display: none; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .memo { padding: 10px; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF</button>
    
    <div class="memo">
        <!-- Header -->
        <div class="header">
            <div class="logo-area">
                <img src="/images/logo.jpeg" alt="Logo" onerror="this.style.display='none'" />
                <div>
                    <div class="company-name">সিয়াম প্রিন্টিং প্রেস এন্ড পেপার হাউজ</div>
                    <div class="company-name-en">Siyam Printing Press & Paper House</div>
                </div>
            </div>
            <div class="memo-title">
                <div class="memo-badge">ক্যাশ মেমো</div>
                <div class="owner-info">
                    <div class="owner-name">স্বত্বাধিকারী ও পরিচালক</div>
                    <div><strong>মোঃ শাহজাহান</strong></div>
                    <div>📞 +880 1913 908249</div>
                    <div>📞 +880 1790 658341</div>
                </div>
            </div>
        </div>

        <!-- Info Fields -->
        <div class="info-fields">
            <div class="info-row">
                <span class="info-label">ক্রমিক নং:</span>
                <span class="info-value">${project.invoice_no}</span>
            </div>
            <div class="info-row">
                <span class="info-label">তারিখ:</span>
                <span class="info-value">${formatDate(new Date(), "dd/MM/yyyy")}</span>
            </div>
            <div class="info-row two-col">
                <div class="info-col">
                    <span class="info-label">গ্রাহকের নাম:</span>
                    <span class="info-value">${project.customer_name || ""}</span>
                </div>
                <div class="info-col">
                    <span class="info-label">ওয়ার্ক ইন:</span>
                    <span class="info-value">${project.project_by || ""}</span>
                </div>
            </div>
            <div class="info-row two-col">
                <div class="info-col">
                    <span class="info-label">ঠিকানা:</span>
                    <span class="info-value">${project.customer_address || ""}</span>
                </div>
                <div class="info-col">
                    <span class="info-label">ক্লাইন্ট রিসিভড:</span>
                    <span class="info-value">${project.client_received_by || ""}</span>
                </div>
            </div>
            <div class="info-row">
                <span class="info-label">মোবাইল:</span>
                <span class="info-value">${project.customer_mobile || ""}</span>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>বিবরণ</th>
                    <th>পরিমাণ</th>
                    <th>দর</th>
                    <th>টাকা</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>${project.title}</strong>
                        ${project.details ? `<br><small>${stripHtml(project.details).substring(0, 150)}${stripHtml(project.details).length > 150 ? '...' : ''}</small>` : ''}
                    </td>
                    <td>১</td>
                    <td>৳${project.total_cost.toFixed(0)}</td>
                    <td><strong>৳${project.total_cost.toFixed(0)}</strong></td>
                </tr>
                ${payments?.length ? payments.map(payment => `
                <tr>
                    <td>পেমেন্ট (${formatDate(payment.payment_date, "dd/MM/yy")}) ${payment.note ? `- ${payment.note}` : ''}</td>
                    <td>-</td>
                    <td>-</td>
                    <td style="color: green;">-৳${payment.amount.toFixed(0)}</td>
                </tr>
                `).join('') : ''}
                <!-- Empty rows for writing -->
                <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-area">
            <div class="totals-box">
                <div class="totals-row">
                    <span>মোট:</span>
                    <span>৳${project.total_cost.toFixed(0)}</span>
                </div>
                <div class="totals-row">
                    <span>জমা:</span>
                    <span>৳${project.paid_amount.toFixed(0)}</span>
                </div>
                <div class="totals-row">
                    <span>বাকি:</span>
                    <span>৳${project.pending_amount.toFixed(0)}</span>
                </div>
            </div>
        </div>

        <!-- Kothay -->
        <div class="kothay-section">
            <span class="kothay-label">কথায়:</span> 
            <span>${numberToWords(project.pending_amount)} টাকা মাত্র</span>
        </div>

        <!-- Signatures with Tagline in center -->
        <div class="signatures">
            <div class="sig-box">
                <div class="sig-line">গ্রাহকের স্বাক্ষর</div>
            </div>
            <div class="sig-center">
                <div style="font-size: 11px; text-align: center;">
                    সকল প্রকার ডিজিটাল প্রিন্ট ও<br>
                    ছাপার কাজের নির্ভরযোগ্য প্রতিষ্ঠান।
                </div>
            </div>
            <div class="sig-box">
                <div class="sig-line">সিয়াম প্রিন্টিং প্রেসের পক্ষে</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-address">
                📍 ভাই ভাই সুপার মার্কেট, গ্রাউন্ড ফ্লোর, জাহাঙ্গীরপুর সেন্টার, মদন, নেত্রকোনা।
            </div>
            <div class="footer-bottom">
                <div class="footer-left">
                    <span>📧 siyamsph2017@gmail.com</span>
                    <span>📧 siyam.print@gmail.com</span>
                </div>
                <div class="footer-right">
                    <div class="footer-tagline">We have complete printing service</div>
                    <div class="footer-sub">So we are the best in quality and print.</div>
                </div>
            </div>
        </div>
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
