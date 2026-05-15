import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const data = await req.json();
  const { error } = await supabaseAdmin
    .from('logs')
    .upsert(data, { onConflict: 'date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}