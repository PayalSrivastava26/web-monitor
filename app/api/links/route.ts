import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: data });
}

export async function POST(req: NextRequest) {
  const { urls, tag } = await req.json();

  const urlList = Array.isArray(urls) ? urls : [urls];
  if (!urlList.length) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  // Check count
  const { count } = await supabase.from('links').select('*', { count: 'exact', head: true });
  if ((count ?? 0) + urlList.length > 8) return NextResponse.json({ error: 'Maximum 8 links allowed.' }, { status: 400 });

  const addedLinks = [];
  for (const url of urlList) {
    // Skip duplicates silently
    const { data: existing } = await supabase.from('links').select('id').eq('url', url).single();
    if (existing) continue;

    const { data, error } = await supabase.from('links').insert({ url, tag: tag || null }).select().single();
    if (!error && data) addedLinks.push(data);
  }

  return NextResponse.json({ links: addedLinks });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await supabase.from('checks').delete().eq('link_id', id);
  await supabase.from('snapshots').delete().eq('link_id', id);
  const { error } = await supabase.from('links').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}