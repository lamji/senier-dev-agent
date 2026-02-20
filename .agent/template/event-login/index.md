# Event Login — View (index.tsx)

> **Role**: Pure UI — all logic comes from `useLogin.ts` ViewModel.
> **Location**: `presentations/SignIn/index.tsx`

```tsx
"use client";

import { useSignIn } from "./useLogin";
import { motion } from "framer-motion";
import { Calendar, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * SignIn Presentation (View)
 *
 * Pure UI — all logic is in useSignIn (ViewModel).
 * Renders the admin login form with glassmorphism styling.
 */

export default function SignInPresentation() {
    const {
        username,
        setUsername,
        password,
        setPassword,
        isLoading,
        error,
        handleSubmit,
    } = useSignIn();

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
            <div className="absolute inset-0 bg-[url(https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80)] bg-cover bg-center opacity-20" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-white/10 bg-black/60 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-amber-500 p-3 rounded-2xl w-fit mb-4">
                            <Calendar className="h-8 w-8 text-black" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Admin Login</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Enter your credentials to access the dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-amber-500"
                                        placeholder="admin"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-amber-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 text-center">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
```
