'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-6">We encountered an unexpected error.</p>
      <div className="flex space-x-4">
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          Try again
        </button>
        <Link 
          href="/"
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 