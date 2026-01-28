"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import type { CustomerWithStats } from "@/lib/types";
import {
    ArrowLeft,
    Loader2,
    Save,
    CalendarIcon,
    Plus,
    Trash2,
    UserPlus,
    Check,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const itemSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "বিবরণ প্রয়োজন"),
    details: z.string().optional(),
    quantity: z.number().min(0, "Must be positive"),
    amount: z.number().min(0, "Must be positive"),
});

const projectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    details: z.string().optional(),
    customer_id: z.string().min(1, "Customer is required"),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    total_cost: z.number().min(0, "Must be positive"),
    project_by: z.string().optional(),
    client_received_by: z.string().optional(),
    priority: z.enum(["high", "mid", "low"]),
    status: z.enum(["ongoing", "pending", "completed", "cancelled", "paused", "delivered"]),
    items: z.array(itemSchema),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function EditProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { data: project, isLoading } = useProject(id);
    const updateMutation = useUpdateProject();
    const createCustomerMutation = useCreateCustomer();
    const { data: customersData, refetch: refetchCustomers } = useCustomers({}, 1, 500);

    // Customer selection states
    const [customerName, setCustomerName] = useState("");
    const [customerMobile, setCustomerMobile] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
    const [isCustomerConfirmed, setIsCustomerConfirmed] = useState(false);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    // Auto-suggestion states
    const [nameSuggestions, setNameSuggestions] = useState<CustomerWithStats[]>([]);
    const [mobileSuggestions, setMobileSuggestions] = useState<CustomerWithStats[]>([]);
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);
    const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
    const nameInputRef = useRef<HTMLDivElement>(null);
    const mobileInputRef = useRef<HTMLDivElement>(null);

    // Check if we can show "Create Customer" button
    const showCreateCustomerButton = customerName.length > 0 && customerMobile.length > 0 && !selectedCustomer && !isCustomerConfirmed;

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: "",
            details: "",
            customer_id: "",
            total_cost: 0,
            project_by: "",
            client_received_by: "",
            priority: "mid",
            status: "pending",
            items: [],
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

        const total = watchedItems.reduce((sum: number, item: any) => {
            return sum + (Number(item.amount) || 0);
        }, 0);

        form.setValue("total_cost", total, { shouldValidate: false });
    }, [JSON.stringify(watchedItems), form]);

    // Load project data
    useEffect(() => {
        if (project) {
            form.reset({
                title: project.title,
                details: project.details || "",
                customer_id: project.customer_id || "",
                start_date: project.start_date ? parseISO(project.start_date) : undefined,
                end_date: project.end_date ? parseISO(project.end_date) : undefined,
                total_cost: project.total_cost,
                project_by: project.project_by || "",
                client_received_by: project.client_received_by || "",
                priority: project.priority,
                status: project.status,
                items: project.items?.map(item => ({
                    ...item,
                    details: item.details || "",
                    amount: item.amount || (item.quantity * (item.rate || 0)),
                })) || [],
            });

            // Set customer info
            if (project.customer_id && project.customer_name) {
                setCustomerName(project.customer_name);
                setCustomerMobile(project.customer_mobile || "");
                setCustomerAddress(project.customer_address || "");
                setIsCustomerConfirmed(true);
            }
        }
    }, [project, form]);

    // Filter suggestions based on name input
    const handleNameChange = (value: string) => {
        setCustomerName(value);
        setSelectedCustomer(null);
        setIsCustomerConfirmed(false);
        form.setValue("customer_id", "");

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
        setCustomerMobile(value);
        setSelectedCustomer(null);
        setIsCustomerConfirmed(false);
        form.setValue("customer_id", "");

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
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerMobile(customer.mobile);
        setCustomerAddress(customer.address || "");
        setIsCustomerConfirmed(true);
        form.setValue("customer_id", customer.id);
        setShowNameSuggestions(false);
        setShowMobileSuggestions(false);
    };

    // Create new customer
    const handleCreateCustomer = async () => {
        if (!customerName || !customerMobile) return;

        setIsCreatingCustomer(true);
        try {
            const newCustomer = await createCustomerMutation.mutateAsync({
                name: customerName,
                mobile: customerMobile,
                address: customerAddress || undefined,
            });

            // Refetch customers and select the new one
            await refetchCustomers();
            setSelectedCustomer(newCustomer as any);
            setIsCustomerConfirmed(true);
            form.setValue("customer_id", newCustomer.id);
        } catch (error) {
            console.error("Failed to create customer:", error);
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // Clear customer selection
    const clearCustomerSelection = () => {
        setSelectedCustomer(null);
        setIsCustomerConfirmed(false);
        setCustomerName("");
        setCustomerMobile("");
        setCustomerAddress("");
        form.setValue("customer_id", "");
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
        if (!isCustomerConfirmed || !data.customer_id) {
            return;
        }

        // Prepare items
        const items = data.items.map((item: any) => {
            const itemData: any = {
                title: item.title,
                details: item.details,
                quantity: item.quantity,
                rate: 0,
                amount: item.amount,
            };

            // Only include ID if it exists and is not an empty string
            if (item.id) {
                itemData.id = item.id;
            }

            return itemData;
        });

        await updateMutation.mutateAsync({
            id,
            data: {
                ...data,
                items,
                start_date: data.start_date
                    ? format(data.start_date, "yyyy-MM-dd")
                    : undefined,
                end_date: data.end_date
                    ? format(data.end_date, "yyyy-MM-dd")
                    : undefined,
            },
        });
        router.push(`/projects/${id}`);
    }

    const totalCost = form.watch("total_cost") || 0;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold">Project not found</h2>
                    <p className="text-muted-foreground mt-2">
                        The project you are looking for does not exist.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/projects">Back to Projects</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/projects/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
                    <p className="text-muted-foreground mt-1">
                        Update project information
                    </p>
                </div>
            </div>

            {/* Customer Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Customer Selection
                        {isCustomerConfirmed && (
                            <Badge variant="default" className="ml-2">
                                <Check className="h-3 w-3 mr-1" />
                                Selected
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Search for an existing customer or create a new one
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isCustomerConfirmed ? (
                        // Show selected customer
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-semibold text-lg">{customerName}</p>
                                    <p className="text-muted-foreground">{customerMobile}</p>
                                    {customerAddress && (
                                        <p className="text-sm text-muted-foreground">{customerAddress}</p>
                                    )}
                                </div>
                                {/* Customer cannot be removed in edit mode */}
                            </div>
                        </div>
                    ) : (
                        // Show customer input fields
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Customer Name */}
                                <div className="relative" ref={nameInputRef}>
                                    <label className="text-sm font-medium mb-2 block">
                                        Customer Name <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        placeholder="গ্রাহকের নাম লিখুন"
                                        value={customerName}
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

                                {/* Customer Mobile */}
                                <div className="relative" ref={mobileInputRef}>
                                    <label className="text-sm font-medium mb-2 block">
                                        Customer Mobile <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        placeholder="মোবাইল নম্বর লিখুন"
                                        value={customerMobile}
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
                            </div>

                            {/* Customer Address */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Customer Address
                                </label>
                                <Input
                                    placeholder="গ্রাহকের ঠিকানা"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                />
                            </div>

                            {/* Create Customer Button */}
                            {showCreateCustomerButton && (
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        onClick={handleCreateCustomer}
                                        disabled={isCreatingCustomer}
                                        className="w-full sm:w-auto"
                                    >
                                        {isCreatingCustomer ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Create New Customer
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        No matching customer found. Click to create a new customer.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Project Form - Only visible when customer is confirmed */}
            {isCustomerConfirmed && (
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

                                    {/* Status */}
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
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
                                                        <SelectItem value="delivered">Delivered</SelectItem>
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
                                                    value={field.value}
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
                                        <Link href={`/projects/${id}`}>Cancel</Link>
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                        {updateMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
