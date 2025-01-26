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
  const [isStreaming, setIsStreaming] = useState(false);

  const { messages, append } = useChat({
    api: '/api/debate',
  });

  const startDebate = async () => {
    if (!topic.trim() || isStreaming) return;
    setIsStreaming(true);

    try {
      // 賛成派の応答を取得
      const proResponse = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, side: 'pro' }),
      });

      if (!proResponse.ok) throw new Error('Pro response failed');
      
      // ストリーミングデータを読み込む
      const proReader = proResponse.body?.getReader();
      let proText = '';
      
      while (proReader) {
        const { done, value } = await proReader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        proText += chunk;
        setProContent(proText); // リアルタイムに更新
      }

      // 反対派の応答を取得（賛成派の内容を含めて）
      const conResponse = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          side: 'con',
          proContent: proText 
        }),
      });

      if (!conResponse.ok) throw new Error('Con response failed');
      
      const conReader = conResponse.body?.getReader();
      let conText = '';
      
      while (conReader) {
        const { done, value } = await conReader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        conText += chunk;
        setConContent(conText); // リアルタイムに更新
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mb-4"
          placeholder="討論テーマを入力"
          disabled={isStreaming}
        />
        <Button 
          onClick={startDebate} 
          disabled={isStreaming}
        >
          {isStreaming ? '討論中...' : '討論開始'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>賛成派</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-gray-100 text-black rounded mb-2 whitespace-pre-wrap">
              {proContent || '待機中...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>反対派</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-gray-100 text-black rounded mb-2 whitespace-pre-wrap">
              {conContent || '待機中...'}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}