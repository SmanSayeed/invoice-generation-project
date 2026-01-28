"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProject } from "@/hooks/use-projects";
import { useCustomers } from "@/hooks/use-customers";
import type { CustomerWithStats } from "@/lib/types";
import {
    ArrowLeft,
    Loader2,
    Save,
    CalendarIcon,
    Plus,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
    title: z.string().min(1, "বিবরণ প্রয়োজন"),
    details: z.string().optional(),
    quantity: z.number().min(0, "Must be positive"),
    amount: z.number().min(0, "Must be positive"),
});

const projectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    details: z.string().optional(),
    customer_id: z.string().optional(),
    customer_name: z.string().min(1, "Customer name is required"),
    customer_mobile: z.string().min(1, "Customer mobile is required"),
    customer_address: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    total_cost: z.number().min(0, "Must be positive"),
    paid_amount: z.number().min(0, "Must be positive"),
    project_by: z.string().optional(),
    client_received_by: z.string().optional(),
    priority: z.enum(["high", "mid", "low"]),
    status: z.enum(["ongoing", "pending", "completed", "cancelled", "paused"]),
    items: z.array(itemSchema),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

function NewProjectForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const customerId = searchParams.get("customer");

    const createMutation = useCreateProject();
    const { data: customersData } = useCustomers({}, 1, 500);

    // Auto-suggestion states
    const [nameSuggestions, setNameSuggestions] = useState<CustomerWithStats[]>([]);
    const [mobileSuggestions, setMobileSuggestions] = useState<CustomerWithStats[]>([]);
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);
    const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
    const nameInputRef = useRef<HTMLDivElement>(null);
    const mobileInputRef = useRef<HTMLDivElement>(null);

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: "",
            details: "",
            customer_id: "",
            customer_name: "",
            customer_mobile: "",
            customer_address: "",
            total_cost: 0,
            paid_amount: 0,
            project_by: "",
            client_received_by: "",
            priority: "mid",
            status: "pending",
            items: [{ title: "", details: "", quantity: 1, amount: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Watch items to calculate totals
    const watchedItems = form.watch("items");

    // Calculate total cost from item amounts
    useEffect(() => {
        if (!watchedItems) return;

        const total = watchedItems.reduce((sum, item) => {
            return sum + (Number(item.amount) || 0);
        }, 0);

        form.setValue("total_cost", total, { shouldValidate: false });
    }, [JSON.stringify(watchedItems), form]);

    // Set customer from URL param
    useEffect(() => {
        if (customerId && customersData?.data) {
            const customer = customersData.data.find(c => c.id === customerId);
            if (customer) {
                form.setValue("customer_id", customer.id);
                form.setValue("customer_name", customer.name);
                form.setValue("customer_mobile", customer.mobile);
                form.setValue("customer_address", customer.address || "");
            }
        }
    }, [customerId, customersData, form]);

    // Filter suggestions based on name input
    const handleNameChange = (value: string) => {
        form.setValue("customer_name", value);
        form.setValue("customer_id", ""); // Clear customer_id when typing new name

        if (value.length > 0 && customersData?.data) {
            const filtered = customersData.data.filter(c =>
                c.name.toLowerCase().includes(value.toLowerCase()) ||
                c.mobile.includes(value)
            );
            setNameSuggestions(filtered);
            setShowNameSuggestions(filtered.length > 0);
        } else {
            setShowNameSuggestions(false);
        }
    };

    // Filter suggestions based on mobile input
    const handleMobileChange = (value: string) => {
        form.setValue("customer_mobile", value);
        form.setValue("customer_id", ""); // Clear customer_id when typing new mobile

        if (value.length > 0 && customersData?.data) {
            const filtered = customersData.data.filter(c =>
                c.mobile.includes(value) ||
                c.name.toLowerCase().includes(value.toLowerCase())
            );
            setMobileSuggestions(filtered);
            setShowMobileSuggestions(filtered.length > 0);
        } else {
            setShowMobileSuggestions(false);
        }
    };

    // Select customer from suggestions
    const selectCustomer = (customer: CustomerWithStats) => {
        form.setValue("customer_id", customer.id);
        form.setValue("customer_name", customer.name);
        form.setValue("customer_mobile", customer.mobile);
        form.setValue("customer_address", customer.address || "");
        setShowNameSuggestions(false);
        setShowMobileSuggestions(false);
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(e.target as Node)) {
                setShowNameSuggestions(false);
            }
            if (mobileInputRef.current && !mobileInputRef.current.contains(e.target as Node)) {
                setShowMobileSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function onSubmit(data: ProjectFormValues) {
        // Prepare items
        const items = data.items.map(item => ({
            title: item.title,
            details: item.details,
            quantity: item.quantity,
            rate: 0, // Keep rate as 0 for backward compatibility
            amount: item.amount,
        }));

        const result = await createMutation.mutateAsync({
            ...data,
            items,
            start_date: data.start_date
                ? format(data.start_date, "yyyy-MM-dd")
                : undefined,
            end_date: data.end_date
                ? format(data.end_date, "yyyy-MM-dd")
                : undefined,
        });
        if (result) {
            router.push("/projects");
        }
    }

    const totalCost = form.watch("total_cost") || 0;
    const paidAmount = form.watch("paid_amount") || 0;
    const pendingAmount = Math.max(0, totalCost - paidAmount);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/projects">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
                    <p className="text-muted-foreground mt-1">
                        Create a new project for a customer
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                        Fill in the project information. Fields marked with * are required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Title */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>
                                                Project Name <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Project title (প্রকল্পের নাম)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Customer Name with Auto-suggestion */}
                                <FormField
                                    control={form.control}
                                    name="customer_name"
                                    render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormLabel>
                                                Customer Name <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div ref={nameInputRef} className="relative">
                                                    <Input
                                                        placeholder="গ্রাহকের নাম লিখুন"
                                                        value={field.value}
                                                        onChange={(e) => handleNameChange(e.target.value)}
                                                        onFocus={() => {
                                                            if (nameSuggestions.length > 0) {
                                                                setShowNameSuggestions(true);
                                                            }
                                                        }}
                                                        autoComplete="off"
                                                    />
                                                    {showNameSuggestions && nameSuggestions.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                                            {nameSuggestions.map((customer) => (
                                                                <div
                                                                    key={customer.id}
                                                                    className="px-3 py-2 cursor-pointer hover:bg-muted flex justify-between items-center"
                                                                    onClick={() => selectCustomer(customer)}
                                                                >
                                                                    <span className="font-medium">{customer.name}</span>
                                                                    <span className="text-sm text-muted-foreground">{customer.mobile}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Customer Mobile with Auto-suggestion */}
                                <FormField
                                    control={form.control}
                                    name="customer_mobile"
                                    render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormLabel>
                                                Customer Mobile <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div ref={mobileInputRef} className="relative">
                                                    <Input
                                                        placeholder="মোবাইল নম্বর লিখুন"
                                                        value={field.value}
                                                        onChange={(e) => handleMobileChange(e.target.value)}
                                                        onFocus={() => {
                                                            if (mobileSuggestions.length > 0) {
                                                                setShowMobileSuggestions(true);
                                                            }
                                                        }}
                                                        autoComplete="off"
                                                    />
                                                    {showMobileSuggestions && mobileSuggestions.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                                            {mobileSuggestions.map((customer) => (
                                                                <div
                                                                    key={customer.id}
                                                                    className="px-3 py-2 cursor-pointer hover:bg-muted flex justify-between items-center"
                                                                    onClick={() => selectCustomer(customer)}
                                                                >
                                                                    <span className="text-sm text-muted-foreground">{customer.mobile}</span>
                                                                    <span className="font-medium">{customer.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Customer Address */}
                                <FormField
                                    control={form.control}
                                    name="customer_address"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>Customer Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="গ্রাহকের ঠিকানা"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Status */}
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="ongoing">Ongoing</SelectItem>
                                                    <SelectItem value="paused">Paused</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Priority */}
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="mid">Medium</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Project Items Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Project Items (আইটেম তালিকা)</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            append({
                                                title: "",
                                                details: "",
                                                quantity: 1,
                                                amount: 0,
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium w-[50%]">বিবরণ</th>
                                                <th className="px-4 py-2 text-left font-medium w-[20%]">পরিমাণ</th>
                                                <th className="px-4 py-2 text-left font-medium w-[20%]">টাকা (৳)</th>
                                                <th className="px-4 py-2 text-center font-medium w-[10%]">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {fields.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="p-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.title`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Item title" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.quantity`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            {...field}
                                                                            onChange={(e) => {
                                                                                const val = parseFloat(e.target.value) || 0;
                                                                                field.onChange(val);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.amount`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            placeholder="0.00"
                                                                            {...field}
                                                                            onChange={(e) => {
                                                                                const val = parseFloat(e.target.value) || 0;
                                                                                field.onChange(val);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive h-8 w-8"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length === 1}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Total Cost */}
                                <FormField
                                    control={form.control}
                                    name="total_cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Cost (৳)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    readOnly
                                                    className="bg-muted font-bold"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Paid Amount */}
                                <FormField
                                    control={form.control}
                                    name="paid_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Payment (৳)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseFloat(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Pending: ৳{pendingAmount.toFixed(2)}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Project By */}
                                <FormField
                                    control={form.control}
                                    name="project_by"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Project By</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Who is handling this project?"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Client Received By */}
                                <FormField
                                    control={form.control}
                                    name="client_received_by"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client Received By</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Who received the client?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Details */}
                            <FormField
                                control={form.control}
                                name="details"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Remarks / Additional Details</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Additional information..."
                                                className="resize-none min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/projects">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Create Project
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewProjectForm />
        </Suspense>
    );
}
