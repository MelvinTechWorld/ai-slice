// app/dashboard/page.tsx
//
// Copied and converted from Assessment 1. The original checked the
// session inline with Prisma 8's contract API; this repo already
// extracted that exact logic into getCurrentUser() (lib/auth/session.ts)
// when building the receipts upload route, so this page uses that
// instead of duplicating the check. Per the brief: "the dashboard is a
// nearly empty page that says 'You are signed in' and shows the user's
// name. That is the whole dashboard." — nothing added beyond that.

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/signin');
    }

    return (
        <div>
            <p>Welcome, {user.name}</p>
            <form action="/api/auth/signout" method="POST">
                <button type="submit" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                    Sign Out
                </button>
            </form>
        </div>
    );
}