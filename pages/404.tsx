import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-6">Sorry, the page you are looking for does not exist.</p>
      <Link 
        href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 