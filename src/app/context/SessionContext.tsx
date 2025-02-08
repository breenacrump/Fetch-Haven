"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
    name: string;
    email: string;
};

type SessionData = {
    user: User;
    expiresAt: number;
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

    const clearSession = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("sessionData");
        router.push("/");
    };

    useEffect(() => {
        const sessionData = localStorage.getItem("sessionData");
        if (sessionData) {
            const { user, expiresAt } = JSON.parse(sessionData);

            if (Date.now() < expiresAt) {
                setUser(user);
                setIsAuthenticated(true);
                router.push("/search");
            } else {
                clearSession();
            }
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
            }

            const userData = { name, email };
            // The session expires in 1 hour
            const expiresAt = Date.now() + 60 * 60 * 1000;

            const sessionData: SessionData = {
                user: userData,
                expiresAt,
            };

            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem("sessionData", JSON.stringify(sessionData));
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
            clearSession();
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
