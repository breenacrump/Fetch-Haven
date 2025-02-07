'use client';

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
    name: string;
    email: string;
};

const SessionContext = createContext<{
    user: User | null;
    isAuthenticated: boolean;
    error: string;
    login: (name: string, email: string) => Promise<boolean | undefined>;
    logout: () => Promise<void>;
}>({
    user: { name: "", email: "" },
    isAuthenticated: false,
    error: "",
    login: async (name: string, email: string) => {
        return false;
    },
    logout: async () => {},
});

export const SessionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            router.push("/search");
        }
    }, []);

    const login = async (name: string, email: string) => {
        try {
            const response = await fetch(
                "https://frontend-take-home-service.fetch.com/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name, email }),
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Login failed");
                return false;
            }

            setUser({ name, email });
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify({ name, email }));
            router.push("/search");
            return true;
        } catch (err) {
            setError("Invalid email or password");
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch(
                "https://frontend-take-home-service.fetch.com/auth/logout",
                {
                    method: "POST",
                    credentials: "include",
                }
            );
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("user");
            router.push("/");
        } catch (error) {
            setError("Logout failed");
            console.error("Logout error:", error);
        }
    };

    return (
        <SessionContext.Provider
            value={{ user, isAuthenticated, error, login, logout }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
};
