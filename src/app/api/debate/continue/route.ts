// src/app/api/debate/continue/route.ts
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const { debateId, side } = await req.json() as {
      debateId: string
      side: 'pro' | 'con'
    }
    // DBから debateId に紐づく会話ログを取得
    const { data: debateRows, error } = await supabase
      .from('debates')
      .select('id, pro_text, con_text, is_finished')
      .eq('id', debateId)
      .single()

    if (error || !debateRows) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    // 負けを認めたかチェック
    if (debateRows.is_finished) {
      return NextResponse.json({
        message: 'This debate is already finished'
      })
    }

    // これまでの pro_text や con_text を元に、新たな論争メッセージを生成
    const systemPrompt = getCharacterPrompt({
      side,
      topic: '継続中のトピック',
      // ここではDBに保存している内容を参照
      existingPro: debateRows.pro_text,
      existingCon: debateRows.con_text,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-3.5-turbo'
      stream: true,
      temperature: 0.9,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
    })

    // ストリーミングで返す (シンプル実装)
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || ''
          controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()
      },
    })

    // まだ負けが確定していない前提 → 受け取ったテキストをDBに追記（省略可）
    // ...
    // もし「負けを認めます」みたいな文言が出たら is_finished=true に更新してもOK

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// 賛成派=女子高生口調, 反対派=子供風口調
function getCharacterPrompt({
  side,
  topic,
  existingPro,
  existingCon,
}: {
  side: 'pro' | 'con'
  topic: string
  existingPro?: string
  existingCon?: string
}): string {
  if (side === 'pro') {
    return `あなたは女子高生風の賛成派です。口調はフランクで「〜なんだよ」「やばくない？」のような若者言葉を使います。

これまでの賛成派主張:
${existingPro ?? ''}

相手（反対派）の主張:
${existingCon ?? ''}

トピック:「${topic}」

相手が負けを認めるまで論争を続けてください。相手を言い負かせるように、更に強い主張をしてください。
`
  } else {
    return `あなたは子供風の反対派です。敬語を使わず語尾に「〜のだ」などを付け、勢いよく反論してください。

これまでの反対派主張:
${existingCon ?? ''}

相手（賛成派）の主張:
${existingPro ?? ''}

トピック:「${topic}」

相手が負けを認めるまで論争を続けてください。相手を言い負かせるように、更に強い主張をしてください。
`
  }
}