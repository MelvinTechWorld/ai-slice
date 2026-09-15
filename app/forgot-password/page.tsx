'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Request failed');
            } else {
                setMessage(data.message || 'Check your email for the reset link.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-center">Reset your password</h1>
            <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
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
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {isLoading ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
            )}

            <div className="mt-4 text-center text-sm">
                <Link href="/signin" className="text-blue-600 hover:underline">
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
