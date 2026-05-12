import { NextRequest, NextResponse } from 'next/server';

const HEIGHT = 159;

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
            content: `あなたはパーソナルトレーナーとエンジニア育成の両方のプロフェッショナルです。身長は${HEIGHT}cmで固定されています。

ユーザーの記録データをもとに、以下の2つの視点から総評してください：

【トレーナーとして】
運動の種類・頻度・時間、体重・体脂肪率・BMIから、身体的なコンディションや習慣の傾向を読み取り、具体的なフィードバックをしてください。BMIが提供されている場合は必ず言及してください。

【エンジニア育成のプロとして】
学習時間・内容・継続性から、成長の軌跡と次のステップを具体的に示してください。

ルール：
- データに基づいた具体的なコメントのみ。根拠のない推測は言わない
- 上から目線にならず、対等なプロとして話す
- 2〜3文で簡潔に。日本語で。絵文字なし`,
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
    const text = data.choices?.[0]?.message?.content ?? 'コメントを取得できませんでした。';
    return NextResponse.json({ comment: text });
  } catch (error) {
    console.log('Fetch error:', error);
    return NextResponse.json({ comment: 'コメントを取得できませんでした。' });
  }
}