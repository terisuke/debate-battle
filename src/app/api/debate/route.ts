/* eslint-disable @typescript-eslint/no-unused-vars */
import OpenAI from 'openai';
// import { OpenAI } from '@ai-sdk/openai'; // こちらでもOK
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  // 賛成派からの主張文を反対派が参照できるよう、proContent をオプションで受け取る
  const { topic, side, proContent } = (await req.json()) as {
    topic: string;
    side?: 'pro' | 'con';
    proContent?: string; // 賛成派の主張を文字列で渡す
  };

  // side が pro の場合 → 賛成派として主張
  // side が con の場合 → 反対派として proContent を参照しつつ反論
  const systemPrompt =
    side === 'pro'
      ? `あなたは討論の賛成派です。以下のトピック「${topic}」について、賛成の立場で主張してください。理由を箇条書きで3つ以上挙げ、その一つひとつを具体的な根拠・例を交えて説明してください。`
      : `あなたは討論の反対派です。以下のトピック「${topic}」について、賛成派の主張に真っ向から反論してください。\n\n【賛成派の主張】\n${
          proContent ?? '（まだ賛成派の主張がありません。）'
        }\n\nこれらの主張に対して、それぞれ反対・論破できる論点を3つ以上挙げ、強い口調で異議を唱えてください。`;

  // GPT-4 へストリーミングでチャットリクエスト
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    // 必要に応じて温度などパラメータ調整
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
    ],
  });

  // OpenAI の応答を ReadableStream に変換
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  // ストリームをそのまま Response として返す
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
}