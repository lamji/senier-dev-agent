# Event Login — ViewModel (useLogin.ts)

> **Role**: All auth logic, state management, and form handling.
> **Location**: `presentations/SignIn/useSignIn.ts`

```ts
import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";

/**
 * SignIn ViewModel
 *
 * All auth logic, state management, and form handling live here.
 * The View only consumes returned state and handlers.
 */
export function useSignIn() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");

            const result = await signIn("credentials", {
                username,
                password,
                callbackUrl: "/admin",
                redirect: true,
            });

            if (result?.error) {
                setError("Invalid credentials. Try admin / admin123");
                setIsLoading(false);
            }
        },
        [username, password]
    );

    return {
        username,
        setUsername,
        password,
        setPassword,
        isLoading,
        error,
        handleSubmit,
    };
}
```
