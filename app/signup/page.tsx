'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.details) {
                    setFieldErrors(data.details);
                }
                setError(data.error || 'Signup failed');
            } else {
                router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-center">Create an account</h1>

            {error && !Object.keys(fieldErrors).length && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                    />
                    {fieldErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.name[0]}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                    />
                    {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.email[0]}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
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
                    {isLoading ? 'Creating account...' : 'Sign up'}
                </button>
            </form>

            <div className="mt-4 text-center text-sm">
                <Link href="/signin" className="text-blue-600 hover:underline">
                    Already have an account? Sign in
                </Link>
            </div>
        </div>
    );
}
