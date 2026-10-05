import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
      <h2 className="text-4xl font-bold mb-2">404</h2>
      <p className="text-slate-400 mb-6 text-sm">Page not found</p>
      <Link
        href="/login"
        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
      >
        Return to Login
      </Link>
    </div>
  );
}
