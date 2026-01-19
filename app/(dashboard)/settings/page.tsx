"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface AppSettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    currency_symbol: string;
    invoice_prefix: string;
}

const defaultSettings: AppSettings = {
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    currency_symbol: "৳",
    invoice_prefix: "INV",
};

export default function SettingsPage() {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);

    const { data, isLoading } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const { data, error } = await supabase.from("settings").select("*");
            if (error) throw error;

            const settingsMap: Record<string, string> = {};
            data?.forEach((s) => {
                settingsMap[s.key] = s.value;
            });

            return {
                company_name: settingsMap.company_name || "",
                company_address: settingsMap.company_address || "",
                company_phone: settingsMap.company_phone || "",
                company_email: settingsMap.company_email || "",
                currency_symbol: settingsMap.currency_symbol || "৳",
                invoice_prefix: settingsMap.invoice_prefix || "INV",
            } as AppSettings;
        },
    });

    useEffect(() => {
        if (data) {
            setSettings(data);
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: async (newSettings: AppSettings) => {
            const updates = Object.entries(newSettings).map(([key, value]) => ({
                key,
                value,
            }));

            for (const update of updates) {
                const { error } = await supabase
                    .from("settings")
                    .upsert(update, { onConflict: "key" });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("Settings saved successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to save settings", {
                description: error.message,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(settings);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your company and invoice settings
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Company Information</CardTitle>
                        </div>
                        <CardDescription>
                            This information will appear on your invoices
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company Name (কোম্পানির নাম)</Label>
                                <Input
                                    id="company_name"
                                    value={settings.company_name}
                                    onChange={(e) =>
                                        setSettings((s) => ({ ...s, company_name: e.target.value }))
                                    }
                                    placeholder="Your company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_phone">Phone</Label>
                                <Input
                                    id="company_phone"
                                    value={settings.company_phone}
                                    onChange={(e) =>
                                        setSettings((s) => ({ ...s, company_phone: e.target.value }))
                                    }
                                    placeholder="+880 1XXX-XXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_email">Email</Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    value={settings.company_email}
                                    onChange={(e) =>
                                        setSettings((s) => ({ ...s, company_email: e.target.value }))
                                    }
                                    placeholder="company@example.com"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="company_address">Address (ঠিকানা)</Label>
                                <Input
                                    id="company_address"
                                    value={settings.company_address}
                                    onChange={(e) =>
                                        setSettings((s) => ({
                                            ...s,
                                            company_address: e.target.value,
                                        }))
                                    }
                                    placeholder="Full company address"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Settings</CardTitle>
                        <CardDescription>
                            Customize how your invoices are generated
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                                <Input
                                    id="invoice_prefix"
                                    value={settings.invoice_prefix}
                                    onChange={(e) =>
                                        setSettings((s) => ({
                                            ...s,
                                            invoice_prefix: e.target.value,
                                        }))
                                    }
                                    placeholder="INV"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Example: {settings.invoice_prefix}-001
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency_symbol">Currency Symbol</Label>
                                <Input
                                    id="currency_symbol"
                                    value={settings.currency_symbol}
                                    onChange={(e) =>
                                        setSettings((s) => ({
                                            ...s,
                                            currency_symbol: e.target.value,
                                        }))
                                    }
                                    placeholder="৳"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end">
                    <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
