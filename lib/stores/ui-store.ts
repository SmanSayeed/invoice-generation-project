import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    theme: "light" | "dark" | "system";
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setTheme: (theme: "light" | "dark" | "system") => void;
    toggleSidebar: () => void;
    toggleSidebarCollapse: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            sidebarCollapsed: false,
            theme: "system",
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            setTheme: (theme) => set({ theme }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            toggleSidebarCollapse: () =>
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        }),
        {
            name: "ui-storage",
        }
    )
);
