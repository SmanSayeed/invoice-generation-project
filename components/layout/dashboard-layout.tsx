"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { Sidebar, Header } from "@/components/layout/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div
                className={cn(
                    "flex min-h-screen flex-col transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
                )}
            >
                <Header />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
