'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    const res = await fetch('/api/status');
    setStatus(await res.json());
    setLoading(false);
  };

  useEffect(() => { check(); }, []);

  const Dot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-400">🔍 Web Monitor</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
          <Link href="/status" className="text-gray-300 hover:text-white">Status</Link>
          <Link href="/links" className="text-gray-300 hover:text-white">All Links</Link>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">System Status</h1>
        <p className="text-gray-400 mb-8">Health of backend, database, and LLM connection</p>

        {loading ? (
          <p className="text-gray-400">Checking system health...</p>
        ) : status && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-4 border ${status.overall ? 'border-green-800 bg-green-950' : 'border-red-800 bg-red-950'}`}>
              <div className="font-semibold text-lg mb-1">
                <Dot ok={status.overall} />{status.overall ? 'All Systems Operational' : 'Some Systems Degraded'}
              </div>
              <div className="text-xs text-gray-400">Last checked: {new Date(status.timestamp).toLocaleString()}</div>
            </div>

            {[
              { key: 'backend', label: '⚙️ Backend (Next.js API)' },
              { key: 'database', label: '🗄️ Database (Supabase)' },
              { key: 'llm', label: '🤖 LLM (Anthropic Claude)' },
            ].map(({ key, label }) => (
              <div key={key} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
                <div>
                  <div className="font-medium flex items-center"><Dot ok={status[key]?.ok} />{label}</div>
                  <div className="text-sm text-gray-400 ml-5">{status[key]?.message}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status[key]?.ok ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {status[key]?.ok ? 'OK' : 'ERROR'}
                </span>
              </div>
            ))}

            <button onClick={check} className="mt-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm transition">
              Refresh Status
            </button>
          </div>
        )}
      </div>
    </main>
  );
}