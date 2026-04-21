import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { summary } = await req.json();

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'あなたは毎日の学習・運動記録に対して、温かく励ましてくれるコーチです。記録を見て、具体的な評価と短い励ましのコメントを2〜3文で日本語で返してください。絵文字を1〜2個使ってOKです。',
          },
          {
            role: 'user',
            content: summary,
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    console.log('Groq response:', JSON.stringify(data));
    const text = data.choices?.[0]?.message?.content ?? 'コメントを取得できませんでした。';
    return NextResponse.json({ comment: text });
  } catch (error) {
    console.log('Fetch error:', error);
    return NextResponse.json({ comment: 'コメントを取得できませんでした。' });
  }
}