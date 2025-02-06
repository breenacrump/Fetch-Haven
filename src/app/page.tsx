"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import {
    Container,
    Paper,
    TextField,
    Button,
    Alert,
} from "@mui/material";

export default function LoginPage() {
    const { login } = useSession();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const success = await login(name, email);
        if (!success) {
            setError(
                "Login failed. Please check your credentials and try again."
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Container maxWidth="xs">
                <Paper className="p-8 w-full">
                    <h1 className="text-2xl font-bold text-center mb-6">
                        Welcome to Fetch Haven
                    </h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <TextField
                            required={true}
                            fullWidth={true}
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full"
                        />
                        <TextField
                            required={true}
                            fullWidth={true}
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full"
                        />
                        {error && (
                            <Alert severity="error" className="mt-4">
                                {error}
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            fullWidth={true}
                            variant="contained"
                            className="mt-6"
                        >
                            Login
                        </Button>
                    </form>
                </Paper>
            </Container>
        </div>
    );
}
