import OpenAI from 'openai';
import { OpenAIStream, streamToResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { topic } = await req.json();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `あなたは討論の賛成派です。${topic}について熱烈に主張してください。`
      }
    ],
  });

  const stream = OpenAIStream(response);
  return new Response(stream);
}