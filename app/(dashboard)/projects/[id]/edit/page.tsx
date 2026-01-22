"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { useCustomers } from "@/hooks/use-customers";
import {
    ArrowLeft,
    Loader2,
    Save,
    CalendarIcon,
    Plus,
    Trash2,
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

const itemSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "বিবরণ প্রয়োজন"),
    details: z.string().optional(),
    quantity: z.number().min(0, "Must be positive"),
    rate: z.number().min(0, "Must be positive"),
    amount: z.number().optional(),
});

const projectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    details: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    total_cost: z.number().min(0, "Must be positive"),
    project_by: z.string().optional(),
    client_received_by: z.string().optional(),
    priority: z.enum(["high", "mid", "low"]),
    status: z.enum(["ongoing", "pending", "completed", "cancelled", "paused"]),
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

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: "",
            details: "",
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

    // Calculate total cost
    useEffect(() => {
        if (!watchedItems) return;

        const total = watchedItems.reduce((sum: number, item: any) => {
            return sum + ((item.quantity || 0) * (item.rate || 0));
        }, 0);

        if (form.getValues("total_cost") !== total) {
            form.setValue("total_cost", total);
        }
    }, [watchedItems, form]);

    useEffect(() => {
        if (project) {
            form.reset({
                title: project.title,
                details: project.details || "",
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
                })) || [],
            });
        }
    }, [project, form]);

    async function onSubmit(data: ProjectFormValues) {
        // Prepare items by removing the amount field which is calculated in DB
        const items = data.items.map(({ amount, ...item }) => item);

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
    const paidAmount = project?.paid_amount || 0;
    const pendingAmount = Math.max(0, totalCost - paidAmount);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
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
                    <p className="text-muted-foreground mt-1">Update project details</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                        Update the project information. Fields marked with * are required.
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
                                                key={field.value}
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
                                                value={field.value}
                                                key={field.value}
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
                                                rate: 0,
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
                                                <th className="px-4 py-2 text-left font-medium w-[40%]">বিবরণ</th>
                                                <th className="px-4 py-2 text-left font-medium w-[15%]">পরিমাণ</th>
                                                <th className="px-4 py-2 text-left font-medium w-[15%]">দর (৳)</th>
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

                                                                                // Calculate row amount
                                                                                const currentItems = form.getValues("items");
                                                                                const rate = currentItems[index].rate || 0;
                                                                                const amount = val * rate;
                                                                                form.setValue(`items.${index}.amount`, amount);

                                                                                // Calculate total cost
                                                                                const total = currentItems.reduce((sum, item, i) => {
                                                                                    if (i === index) return sum + amount;
                                                                                    return sum + ((item.quantity || 0) * (item.rate || 0));
                                                                                }, 0);
                                                                                form.setValue("total_cost", total);
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
                                                            name={`items.${index}.rate`}
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

                                                                                // Calculate row amount
                                                                                const currentItems = form.getValues("items");
                                                                                const quantity = currentItems[index].quantity || 0;
                                                                                const amount = quantity * val;
                                                                                form.setValue(`items.${index}.amount`, amount);

                                                                                // Calculate total cost
                                                                                const total = currentItems.reduce((sum, item, i) => {
                                                                                    if (i === index) return sum + amount;
                                                                                    return sum + ((item.quantity || 0) * (item.rate || 0));
                                                                                }, 0);
                                                                                form.setValue("total_cost", total);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="px-3 py-2 font-medium">
                                                            ৳{watchedItems[index]?.amount?.toFixed(2) || "0.00"}
                                                        </div>
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
                                {/* Start Date */}
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
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
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* End Date */}
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date</FormLabel>
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
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                                            <FormDescription>
                                                Paid: ৳{paidAmount.toFixed(2)} | Pending: ৳
                                                {pendingAmount.toFixed(2)}
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
        </div>
    );
}
