'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [urls, setUrls] = useState('');
  const [tag, setTag] = useState('');
  const [links, setLinks] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddLinks = async () => {
    setError('');
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urlList.length < 1) { setError('Enter at least 1 URL'); return; }
    if (urlList.length > 8) { setError('Maximum 8 links allowed'); return; }
    const invalid = urlList.filter(u => { try { new URL(u); return false; } catch { return true; } });
    if (invalid.length) { setError(`Invalid URLs: ${invalid.join(', ')}`); return; }

    setAddLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList, tag: tag.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add links');
      setLinks(prev => [...prev, ...data.links]);
      setUrls('');
      setTag('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleCheckNow = async () => {
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-400">🔍 Web Monitor</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
          <Link href="/status" className="text-gray-300 hover:text-white">Status</Link>
          <Link href="/links" className="text-gray-300 hover:text-white">All Links</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3">Track Website Changes</h2>
          <p className="text-gray-400 text-lg">Add links → Check for changes → Get AI summaries instantly</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-10 text-center text-sm">
          {[['1', 'Add Links', 'Paste URLs you want to monitor'],
            ['2', 'Check Now', 'Fetch & diff against last snapshot'],
            ['3', 'See Changes', 'AI-summarized diff with citations']].map(([n, t, d]) => (
            <div key={n} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{n}</div>
              <div className="font-semibold mb-1">{t}</div>
              <div className="text-gray-400 text-xs">{d}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <label className="block text-sm text-gray-400 mb-2">URLs to monitor (3–8 recommended, one per line)</label>
          <textarea
            className="w-full bg-gray-800 rounded-lg p-3 text-sm font-mono border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
            rows={4}
            placeholder={"https://openai.com/pricing\nhttps://example.com/docs"}
            value={urls}
            onChange={e => setUrls(e.target.value)}
          />
          <div className="flex gap-3 mt-3">
            <input
              className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
              placeholder="Tag (optional): e.g. pricing, docs, policy"
              value={tag}
              onChange={e => setTag(e.target.value)}
            />
            <button
              onClick={handleAddLinks}
              disabled={addLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              {addLoading ? 'Adding...' : '+ Add Links'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">⚠ {error}</p>}
        </div>

        <button
          onClick={handleCheckNow}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded-xl font-semibold text-lg transition mb-8"
        >
          {loading ? '⏳ Checking...' : '🔍 Check Now'}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Results</h3>
            {results.map((r, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <a href={r.url} target="_blank" className="text-indigo-400 hover:underline text-sm font-mono break-all">{r.url}</a>
                  {r.tag && <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full ml-2 shrink-0">{r.tag}</span>}
                </div>
                <div className={`text-xs font-medium mb-3 ${r.changed ? 'text-yellow-400' : 'text-green-400'}`}>
                  {r.error ? '❌ Error: ' + r.error : r.changed ? '⚡ Changed' : '✅ No changes'}
                </div>
                {r.summary && (
                  <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-200 mb-3">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">AI Summary</div>
                    {r.summary}
                  </div>
                )}
                {r.diff && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-400 hover:text-white mb-2">View Diff</summary>
                    <pre className="bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-64 text-green-300 whitespace-pre-wrap">{r.diff}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

     <footer className="text-center text-gray-600 text-sm py-6 border-t border-gray-800">
  <Link href="/status" className="hover:text-gray-400">System Status</Link>
</footer>
    </main>
  );
}