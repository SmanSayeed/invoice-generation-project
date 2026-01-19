"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    Menu,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Customers",
        href: "/customers",
        icon: Users,
    },
    {
        title: "Projects",
        href: "/projects",
        icon: FolderKanban,
    },
];

const bottomNavItems = [
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { sidebarCollapsed, sidebarOpen, toggleSidebarCollapse, setSidebarOpen } =
        useUIStore();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch by only rendering theme toggle after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            toast.success("Logged out successfully");
            router.push("/login");
            router.refresh();
        } catch {
            toast.error("Failed to log out");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const NavLink = ({
        item,
        collapsed,
    }: {
        item: (typeof navItems)[0];
        collapsed: boolean;
    }) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        const linkContent = (
            <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
            </Link>
        );

        if (collapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                        {item.title}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return linkContent;
    };

    return (
        <TooltipProvider>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300",
                    sidebarCollapsed ? "w-[72px]" : "w-64",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b px-4">
                    {!sidebarCollapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                InvoiceGen
                            </span>
                        </Link>
                    )}
                    {sidebarCollapsed && (
                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                            <FileText className="h-4 w-4 text-white" />
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} collapsed={sidebarCollapsed} />
                        ))}
                    </nav>
                </ScrollArea>

                {/* Bottom section */}
                <div className="border-t px-3 py-4">
                    <nav className="flex flex-col gap-1">
                        {bottomNavItems.map((item) => (
                            <NavLink key={item.href} item={item} collapsed={sidebarCollapsed} />
                        ))}

                        {/* Theme toggle */}
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size={sidebarCollapsed ? "icon" : "default"}
                                    className={cn(
                                        "justify-start gap-3",
                                        sidebarCollapsed && "w-10 px-0 justify-center"
                                    )}
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                >
                                    {mounted && theme === "dark" ? (
                                        <Sun className="h-5 w-5 shrink-0" />
                                    ) : (
                                        <Moon className="h-5 w-5 shrink-0" />
                                    )}
                                    {!sidebarCollapsed && (
                                        <span>{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            {sidebarCollapsed && (
                                <TooltipContent side="right" className="font-medium">
                                    {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
                                </TooltipContent>
                            )}
                        </Tooltip>

                        {/* Logout */}
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size={sidebarCollapsed ? "icon" : "default"}
                                    className={cn(
                                        "justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
                                        sidebarCollapsed && "w-10 px-0 justify-center"
                                    )}
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                >
                                    <LogOut className="h-5 w-5 shrink-0" />
                                    {!sidebarCollapsed && <span>Logout</span>}
                                </Button>
                            </TooltipTrigger>
                            {sidebarCollapsed && (
                                <TooltipContent side="right" className="font-medium">
                                    Logout
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </nav>

                    <Separator className="my-3" />

                    {/* Collapse toggle */}
                    <Button
                        variant="outline"
                        size={sidebarCollapsed ? "icon" : "default"}
                        className={cn(
                            "w-full justify-center gap-2",
                            sidebarCollapsed && "px-0"
                        )}
                        onClick={toggleSidebarCollapse}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4" />
                                <span>Collapse</span>
                            </>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}

export function Header() {
    const { sidebarCollapsed, setSidebarOpen } = useUIStore();

    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-6 transition-all duration-300",
                sidebarCollapsed ? "lg:pl-[96px]" : "lg:pl-[280px]"
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm">
                        AD
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
