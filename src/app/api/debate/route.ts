/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/debate/route.ts
import OpenAI from 'openai';
// import { OpenAI } from '@ai-sdk/openai'; // こちらでもOK
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('POST リクエストを受信しました');

  // 賛成派からの主張文を反対派が参照できるよう、proContent をオプションで受け取る
  const { topic, side, proContent } = (await req.json()) as {
    topic: string;
    side?: 'pro' | 'con';
    proContent?: string; // 賛成派の主張を文字列で渡す
  };

  console.log('リクエストパラメータ:', { topic, side, proContent });

  // side が pro の場合 → 賛成派として主張
  // side が con の場合 → 反対派として proContent を参照しつつ反論
  const systemPrompt =
    side === 'pro'
      ? `あなたは討論の賛成派です。以下のトピック「${topic}」について、賛成の立場で主張してください。理由を箇条書きで3つ以上挙げ、その一つひとつを具体的な根拠・例を交えて説明してください。`
      : `あなたは討論の反対派です。以下のトピック「${topic}」について、賛成派の主張に真っ向から反論してください。\n\n【賛成派の主張】\n${
          proContent ?? '（まだ賛成派の主張がありません。）'
        }\n\nこれらの主張に対して、それぞれ反対・論破できる論点を3つ以上挙げ、強い口調で異議を唱えてください。`;

  console.log('システムプロンプト:', systemPrompt);

  // GPT-4 または GPT-3.5-turbo など、正しいモデルを指定する
  const response = await openai.chat.completions.create({
    model: 'gpt-4', // ← 'gpt-3.5-turbo' 等に変更可。'gpt-4o' は存在しない
    stream: true,
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
    ],
  });

  console.log('OpenAI APIからレスポンスを受信しました');

  // ストリーミングレスポンスを ReadableStream に変換
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        // ここで都度 chunk.choices[0]?.delta?.content があれば取り出す
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(new TextEncoder().encode(text));
      }
      console.log('ストリーミング完了');
      controller.close();
    },
  });

  console.log('レスポンスストリームを作成しました');

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
}