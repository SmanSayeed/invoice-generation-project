import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setProfile: (profile: Profile | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            profile: null,
            isLoading: true,
            setUser: (user) => set({ user }),
            setSession: (session) => set({ session }),
            setProfile: (profile) => set({ profile }),
            setIsLoading: (isLoading) => set({ isLoading }),
            reset: () =>
                set({
                    user: null,
                    session: null,
                    profile: null,
                    isLoading: false,
                }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
            }),
        }
    )
);
