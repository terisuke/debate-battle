// app/api/debate/route.ts
import { OpenAI } from '@ai-sdk/openai';
import { StreamingTextResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { topic, side } = await req.json();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `あなたは討論の${side === 'pro' ? '賛成派' : '反対派'}です。${topic}について熱烈に主張してください。`
      }
    ],
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new StreamingTextResponse(stream);
}