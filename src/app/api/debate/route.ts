/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/debate/route.ts
import OpenAI from 'openai';
// import { OpenAI } from '@ai-sdk/openai'; // こちらでもOK

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('POST リクエストを受信しました');

  // 賛成派の主張文を反対派が参照できるよう、proContentを追加
  const { topic, side, proContent } = (await req.json()) as {
    topic: string;
    side?: 'pro' | 'con';
    proContent?: string;
  };

  console.log('リクエストパラメータ:', { topic, side, proContent });

  // 賛成派(女子高生風) or 反対派(子供風) による Systemメッセージ
  const systemPrompt =
    side === 'pro'
      ? `
あなたは「女子高生風」の賛成派です。語尾に「〜なんだよ」「やばくない？」などを使い、
フランクな話し方で意見を言います。相手が納得するまで主張を続けてください。

トピック:「${topic}」

${proContent ? `相手の反論: ${proContent}` : ''}

まずは賛成の立場で主張を展開してください。理由を3つ以上挙げ、
各理由を具体的な根拠や例を交えて説明しつつ、
女子高生特有のフランクな言葉遣いで主張してください。
`
      : `
あなたは「子供風」の反対派です。敬語は使わず語尾に「〜のだ」「〜だもん」などを付け、
勢いよく反論します。相手が納得するまで論破してください。

トピック:「${topic}」

【賛成派の主張】:
${proContent ?? '（まだ賛成派の主張がありません。）'}

相手の主張を論破できる反論点を3つ以上挙げ、
子供らしい口調で相手を言い負かしてください。
`;

  console.log('システムプロンプト:', systemPrompt);

  // OpenAI API (GPT-4 or GPT-3.5-turbo) を呼び出し。例では 'gpt-3.5-turbo'
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', 
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
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(new TextEncoder().encode(text));
      }
      console.log('ストリーミング完了');
      controller.close();
    },
  });

  console.log('レスポンスストリームを作成しました');

  // text/event-stream 形式でストリーミングレスポンス返却
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
}