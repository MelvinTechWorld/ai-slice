// app/receipts/upload/page.tsx
//
// The upload screen. Accepts one file, uploads it via the existing
// /api/receipts/upload route, and redirects to the processing/result
// screen. Client-side type/size checks mirror the server's — the server
// check is the one that actually holds.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 8 * 1024 * 1024;

export default function UploadReceiptPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setError('');

    if (!selected) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Only JPEG, PNG, WEBP, or PDF files are accepted.');
      setFile(null);
      return;
    }

    if (selected.size > MAX_BYTES) {
      setError('File exceeds the 8MB limit.');
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Choose a file first.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      router.push(`/receipts/${data.receiptId}`);
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Upload a receipt</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-1">
            Receipt (JPEG, PNG, WEBP, or PDF — up to 8MB)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isUploading ? 'Uploading...' : 'Upload receipt'}
        </button>
      </form>
    </div>
  );
}
