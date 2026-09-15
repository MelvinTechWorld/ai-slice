'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get('email') || '';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus management for 6-digit code
    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);
        if (pastedData.length > 0) {
            inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
        }
    };

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        const fullCode = code.join('');

        if (fullCode.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: fullCode }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Verification failed');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to resend code');
                if (res.status === 429) {
                    setCooldown(60); // Start cooldown if rate limited
                }
            } else {
                setMessage('A new code has been sent to your email.');
                setCooldown(60);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="text-center text-slate-400">
                <p>No email provided. Please sign up first.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Verify your email</h1>
                <p className="text-slate-400">
                    We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between gap-2">
                    {code.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={handlePaste}
                            className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/20"
                            placeholder="-"
                            aria-label={`Digit ${idx + 1}`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-slate-400 text-sm mb-4">Didn't receive the code?</p>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors disabled:text-slate-500 disabled:hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                >
                    {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Code'}
                </button>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full">
                <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
                    <VerifyForm />
                </Suspense>
            </div>
        </main>
    );
}
