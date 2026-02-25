import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Check backend (trivially ok if we're here)
  const backendStart = Date.now();
  const backendLatency = Date.now() - backendStart;

  // Check database
  let dbOk = false;
  let dbLatency = 0;
  let dbCount = 0;
  try {
    const dbStart = Date.now();
    const { count, error } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true });
    dbLatency = Date.now() - dbStart;
    if (!error) {
      dbOk = true;
      dbCount = count ?? 0;
    }
  } catch {}

  // Check LLM
  let llmOk = false;
  let llmLatency = 0;
  let llmModel = '';
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const llmStart = Date.now();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    llmLatency = Date.now() - llmStart;
    const data = await res.json();
    if (data.id || data.content) {
      llmOk = true;
      llmModel = data.model || 'claude-haiku-4-5-20251001';
    }
  } catch {}

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: dbOk && llmOk,
    backend: { ok: true, latency: backendLatency, message: 'Next.js API running' },
    database: { ok: dbOk, latency: dbLatency, count: dbCount, message: dbOk ? 'Connected to Supabase' : 'Connection failed' },
    llm: { ok: llmOk, latency: llmLatency, model: llmModel, message: llmOk ? `Anthropic API connected (${llmModel})` : 'Connection failed' },
  });
}