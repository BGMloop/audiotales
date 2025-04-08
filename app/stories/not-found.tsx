'use client';

import Link from 'next/link';

export default function StoriesNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h2 className="text-3xl font-bold mb-4">Story Not Found</h2>
      <p className="mb-6">Sorry, the story you are looking for does not exist.</p>
      <div className="flex space-x-4">
        <Link 
          href="/stories"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          Browse Stories
        </Link>
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