import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const data = await req.json();
  const { error } = await supabaseAdmin
    .from('logs')
    .upsert(data, { onConflict: 'date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}