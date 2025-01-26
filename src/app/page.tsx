/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const [proContent, setProContent] = useState('');
  const [conContent, setConContent] = useState('');

  const { messages, append } = useChat<Message>({
    api: '/api/debate',
  });

  const startDebate = async () => {
    if (!topic.trim()) return;

    // まずユーザー入力を "user" ロールで表示用に追加
    await append({
      role: 'user',
      content: topic,
      data: { side: 'user' },
    });

    // ===== 賛成派の呼び出し =====
    let tempProContent = '';
    await append(
      {
        role: 'assistant',
        content: '',
        data: { side: 'pro' },
      },
      {
        body: {
          topic,
          side: 'pro', // 賛成派
        },
        onFinish: (message) => {
          console.log('Pro side final output:', message.content); // デバッグ出力
          tempProContent = message.content;
          setProContent(message.content);
        },
      }
    );

    // ===== 反対派の呼び出し =====
    await append(
      {
        role: 'assistant',
        content: '',
        data: { side: 'con' },
      },
      {
        body: {
          topic,
          side: 'con',
          proContent: tempProContent,
        },
        onFinish: (message) => {
          console.log('Con side final output:', message.content); // デバッグ出力
          setConContent(message.content);
        },
      }
    );
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
            {/* ここで賛成派のテキストを直に表示 → 見やすいようにスレート色で */}
            <div className="p-2 bg-gray-100 text-black rounded mb-2 whitespace-pre-wrap">
              {proContent}
            </div>
          </CardContent>
        </Card>

        {/* 反対派 */}
        <Card>
          <CardHeader>
            <CardTitle>反対派</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-gray-100 text-black rounded mb-2 whitespace-pre-wrap">
              {conContent}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}