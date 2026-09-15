// app/receipts/[id]/page.tsx
//
// Combines the processing-state and result screens into one page.
//
// FIX: the polling loop previously stopped for good once extraction
// reached DONE (nothing left "ongoing" at that moment). Clicking
// Summarize then did a single one-off status fetch, but never restarted
// the loop — so even after the worker finished the follow-up job
// seconds later, the page had no active poll left to notice and update.
// pollKey forces the polling effect to start a fresh chain whenever a
// follow-up is triggered.

'use client';

import { useEffect, useState, use } from 'react';

interface LineItem {
  description: string;
  quantity: number | null;
  unitPriceMinor: number | null;
  amountMinor: number;
}

interface ReceiptStatus {
  receipt: { id: string; originalFilename: string; createdAt: string };
  extraction: {
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    errorMessage: string | null;
    result: {
      merchant: string | null;
      totalMinor: number | null;
      currency: string | null;
      purchaseDate: string | null;
      lineItems: LineItem[];
    } | null;
  };
  followup: {
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    errorMessage: string | null;
    action: string | null;
    resultText: string | null;
  } | null;
}

function formatMinor(amount: number | null, currency: string | null) {
  if (amount === null) return '—';
  const major = (amount / 100).toFixed(2);
  return currency ? `${currency} ${major}` : major;
}

export default function ReceiptStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ReceiptStatus | null>(null);
  const [error, setError] = useState('');
  const [followupBusy, setFollowupBusy] = useState(false);
  const [pollKey, setPollKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/receipts/${id}`);
        if (!res.ok) {
          const body = await res.json();
          if (!cancelled) setError(body.error || 'Failed to load receipt');
          return;
        }
        const body: ReceiptStatus = await res.json();
        if (cancelled) return;

        setData(body);

        const extractionOngoing =
          body.extraction.status === 'PENDING' || body.extraction.status === 'PROCESSING';
        const followupOngoing =
          body.followup?.status === 'PENDING' || body.followup?.status === 'PROCESSING';

        if (extractionOngoing || followupOngoing) {
          timer = setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) setError('An unexpected error occurred.');
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // pollKey has no meaning of its own — bumping it is just how we tell
    // this effect "start a fresh polling chain now."
  }, [id, pollKey]);

  const handleFollowup = async (action: 'summarize' | 'rephrase' | 'expand') => {
    setFollowupBusy(true);
    try {
      const res = await fetch(`/api/receipts/${id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Could not start follow-up');
        return;
      }
      // Restart the polling loop rather than doing a single one-off
      // check — the follow-up job takes several seconds and the loop
      // above had already stopped itself once extraction finished.
      setPollKey((k) => k + 1);
    } finally {
      setFollowupBusy(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  const { extraction, followup } = data;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-sm space-y-6">
      <h1 className="text-2xl font-bold text-center">Receipt</h1>

      {extraction.status === 'PENDING' && (
        <p className="text-center text-gray-500">Queued — waiting to start...</p>
      )}
      {extraction.status === 'PROCESSING' && (
        <p className="text-center text-gray-500">Processing your receipt...</p>
      )}
      {extraction.status === 'FAILED' && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          Extraction failed: {extraction.errorMessage || 'Unknown error'}
        </div>
      )}

      {extraction.status === 'DONE' && extraction.result && (
        <div className="space-y-3">
          <div>
            <span className="font-medium">Merchant:</span>{' '}
            {extraction.result.merchant ?? '—'}
          </div>
          <div>
            <span className="font-medium">Total:</span>{' '}
            {formatMinor(extraction.result.totalMinor, extraction.result.currency)}
          </div>
          <div>
            <span className="font-medium">Date:</span>{' '}
            {extraction.result.purchaseDate ?? '—'}
          </div>

          {extraction.result.lineItems.length > 0 && (
            <div>
              <span className="font-medium">Items:</span>
              <ul className="mt-1 space-y-1 text-sm">
                {extraction.result.lineItems.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.description}
                      {item.quantity ? ` ×${item.quantity}` : ''}
                    </span>
                    <span>{formatMinor(item.amountMinor, extraction.result?.currency ?? null)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t">
            {!followup && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleFollowup('summarize')}
                  disabled={followupBusy}
                  className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm rounded"
                >
                  Summarize
                </button>
              </div>
            )}

            {followup && (followup.status === 'PENDING' || followup.status === 'PROCESSING') && (
              <p className="text-center text-gray-500 text-sm">Generating summary...</p>
            )}

            {followup && followup.status === 'FAILED' && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                Follow-up failed: {followup.errorMessage || 'Unknown error'}
              </div>
            )}

            {followup && followup.status === 'DONE' && followup.resultText && (
              <div className="p-3 bg-gray-50 rounded text-sm">{followup.resultText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}