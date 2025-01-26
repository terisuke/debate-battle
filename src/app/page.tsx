'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Message as AIMessage } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';

interface Message extends AIMessage {
  data?: {
    side?: 'pro' | 'con' | 'user';
  };
}

export default function Home() {
  const [topic, setTopic] = useState('');

  // ★ ジェネリクスで Message 型を指定
  const { messages, append } = useChat<Message>({
    api: '/api/debate',
    // 今回は最初に送る body があるなら、ここに書いてもOK
    // ただし pro/con を使い分けるなら append のオプションで渡す方が柔軟
  });

  // 討論開始
  const startDebate = async () => {
    if (!topic.trim()) return;

    // ユーザーのメッセージ（topic）を送信
    await append({
      role: 'user',
      content: topic,
      data: { side: 'user' },
    });

    // 賛成派＆反対派を並列で呼び出す
    await Promise.all([
      append(
        {
          role: 'assistant',
          content: '',
          data: { side: 'pro' },
        },
        {
          body: {
            topic,
            side: 'pro',
          },
        },
      ),
      append(
        {
          role: 'assistant',
          content: '',
          data: { side: 'con' },
        },
        {
          body: {
            topic,
            side: 'con',
          },
        },
      ),
    ]);
  };

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mb-4"
          placeholder="討論テーマを入力"
        />
        <Button onClick={startDebate}>討論開始</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 賛成派 */}
        <Card>
          <CardHeader>
            <CardTitle>賛成派</CardTitle>
          </CardHeader>
          <CardContent>
            {messages
              .filter((m) => m.data?.side === 'pro')
              .map((m, i) => (
                <div key={i} className="p-2 bg-secondary rounded mb-2">
                  {m.content}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* 反対派 */}
        <Card>
          <CardHeader>
            <CardTitle>反対派</CardTitle>
          </CardHeader>
          <CardContent>
            {messages
              .filter((m) => m.data?.side === 'con')
              .map((m, i) => (
                <div key={i} className="p-2 bg-secondary rounded mb-2">
                  {m.content}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}