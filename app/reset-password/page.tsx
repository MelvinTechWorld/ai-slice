'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('No reset token provided. Please request a new link.');
            return;
        }

        setError('');
        setFieldErrors({});
        setMessage('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.details) {
                    setFieldErrors(data.details);
                }
                setError(data.error || 'Failed to reset password');
            } else {
                setMessage('Password reset successfully. Redirecting to sign in...');
                setTimeout(() => {
                    router.push('/signin');
                }, 2000);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <p className="text-red-600 mb-4">Invalid or missing reset token.</p>
                <Link href="/forgot-password" className="text-blue-600 hover:underline">
                    Request a new link
                </Link>
            </div>
        );
    }

    return (
        <>
            <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your new password below.
            </p>

            {error && !Object.keys(fieldErrors).length && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 rounded text-sm">
                    {message}
                </div>
            )}

            {!message && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1">
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                        />
                        {fieldErrors.password && (
                            <p className="mt-1 text-sm text-red-500">{fieldErrors.password[0]}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {isLoading ? 'Resetting...' : 'Reset password'}
                    </button>
                </form>
            )}
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-center">Set new password</h1>
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
