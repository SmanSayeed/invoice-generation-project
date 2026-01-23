"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, User, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Separate schemas for independent updates
const nameSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

const emailSchema = z.object({
    email: z.string().email("Invalid email"),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(6, "Password must be at least 6 characters"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type NameFormValues = z.infer<typeof nameSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const { user, profile, setProfile } = useAuthStore();

    // Separate loading states
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Separate forms
    const nameForm = useForm<NameFormValues>({
        resolver: zodResolver(nameSchema),
        defaultValues: {
            name: profile?.name || user?.email?.split("@")[0] || "",
        },
    });

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: profile?.email || user?.email || "",
        },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Fetch user and profile on mount
    useEffect(() => {
        async function loadUserAndProfile() {
            // First, get the current user from Supabase session
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (!currentUser) {
                console.log("No user found in session");
                return;
            }

            // Update auth store if user not set
            if (!user) {
                useAuthStore.getState().setUser(currentUser);
            }

            // Fetch profile from DB
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", currentUser.id)
                    .single();

                if (data && !error) {
                    setProfile(data);
                    // Update forms with DB data
                    nameForm.reset({ name: data.name || currentUser.email?.split("@")[0] || "" });
                    emailForm.reset({ email: data.email || currentUser.email || "" });
                } else {
                    // No profile, use user email as defaults
                    nameForm.reset({ name: currentUser.email?.split("@")[0] || "" });
                    emailForm.reset({ email: currentUser.email || "" });
                }
            } catch (error) {
                console.error("Error loading profile:", error);
                // Fallback to user email
                nameForm.reset({ name: currentUser.email?.split("@")[0] || "" });
                emailForm.reset({ email: currentUser.email || "" });
            }
        }

        loadUserAndProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update forms when profile changes (from other sources)
    useEffect(() => {
        if (profile?.name) {
            nameForm.reset({ name: profile.name });
        }
    }, [profile?.name]);

    useEffect(() => {
        if (profile?.email) {
            emailForm.reset({ email: profile.email });
        }
    }, [profile?.email]);

    // Handle Name Update
    async function onNameSubmit(data: NameFormValues) {
        setIsUpdatingName(true);
        try {
            if (user) {
                const { error: profileError } = await supabase
                    .from("profiles")
                    .upsert({
                        id: user.id,
                        name: data.name,
                        // Preserve existing email if any, or default to input? 
                        // Actually, upsert needs all fields OR we should use update if row exists?
                        // But we want to handle "new user" case too.
                        // Best strategy: Upsert with all current known values.
                        email: profile?.email || user.email
                    });

                if (profileError) throw profileError;

                // Sync local store
                setProfile({
                    id: user.id,
                    created_at: profile?.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    avatar_url: profile?.avatar_url || null,
                    name: data.name,
                    email: profile?.email || user.email // Keep existing email
                });
            }

            toast.success("Name updated successfully");
            router.refresh();
        } catch (error: any) {
            toast.error("Failed to update name", {
                description: error.message,
            });
        } finally {
            setIsUpdatingName(false);
        }
    }

    // Handle Email Update - Updates login email via database function
    async function onEmailSubmit(data: EmailFormValues) {
        setIsUpdatingEmail(true);
        try {
            // Call the database function to update auth.users email
            const { data: result, error } = await supabase
                .rpc('update_user_email', { new_email: data.email });

            console.log("RPC result:", result, "error:", error);

            if (error) {
                console.error("RPC error:", error);
                throw error;
            }

            // Sync local store
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                setProfile({
                    id: currentUser.id,
                    created_at: profile?.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    avatar_url: profile?.avatar_url || null,
                    name: profile?.name || data.email.split("@")[0],
                    email: data.email
                });
            }

            toast.success("Login email updated successfully. Please use the new email to login next time.");
            router.refresh();
        } catch (error: any) {
            console.error("Email update error:", error);
            toast.error("Failed to update email", {
                description: error?.message || JSON.stringify(error),
            });
        } finally {
            setIsUpdatingEmail(false);
        }
    }

    async function onPasswordSubmit(data: PasswordFormValues) {
        setIsUpdatingPassword(true);
        try {
            // Get current user email
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser?.email) {
                throw new Error("User session not found. Please login again.");
            }

            // Step 1: Verify current password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: currentUser.email,
                password: data.currentPassword,
            });

            if (signInError) {
                throw new Error("Current password is incorrect");
            }

            // Step 2: If current password is correct, update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.newPassword,
            });

            if (updateError) throw updateError;

            toast.success("Password updated successfully");
            passwordForm.reset();
        } catch (error: any) {
            toast.error("Failed to update password", {
                description: error.message,
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account settings
                </p>
            </div>

            <div className="space-y-6">

                {/* Name Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Display Name</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...nameForm}>
                            <form
                                onSubmit={nameForm.handleSubmit(onNameSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={nameForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isUpdatingName}>
                                        {isUpdatingName ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Name
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Email Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Email Address</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...emailForm}>
                            <form
                                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Different from login email
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isUpdatingEmail}>
                                        {isUpdatingEmail ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Email
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Password Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Change Password</CardTitle>
                        </div>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isUpdatingPassword}>
                                        {isUpdatingPassword ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Update Password"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
