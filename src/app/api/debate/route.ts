/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/debate/route.ts
import OpenAI from 'openai';
// import { OpenAI } from '@ai-sdk/openai'; // こちらでもOK
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  // 型アサーションで side を許可
  const { topic, side } = (await req.json()) as {
    topic: string;
    side?: 'pro' | 'con';
  };

  // GPT-4 へストリーミングでチャットリクエスト
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `あなたは討論の${
          side === 'pro' ? '賛成派' : '反対派'
        }です。${topic}について熱烈に主張してください。`,
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