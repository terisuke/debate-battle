/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Message as AIMessage } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

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
  const [debateId, setDebateId] = useState('');
  const [side, setSide] = useState<'pro' | 'con'>('pro');
  const [streamingText, setStreamingText] = useState('');

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

  const handleContinue = async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/debate/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debateId, side }),
      });

      if (!res.ok) {
        alert('継続リクエストが失敗しました');
        return;
      }

      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value);
          setStreamingText(accumulated);
          if (side === 'pro') {
            setProContent(accumulated);
          } else {
            setConContent(accumulated);
          }
        }
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

      <div className="mb-8 flex gap-4 items-end">
        <Input
          value={debateId}
          onChange={(e) => setDebateId(e.target.value)}
          placeholder="討論ID"
          disabled={isStreaming}
          className="max-w-xs"
        />
        <Select
          value={side}
          onValueChange={(value: 'pro' | 'con') => setSide(value)}
          disabled={isStreaming}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="立場を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pro">賛成派 (女子高生風)</SelectItem>
            <SelectItem value="con">反対派 (子供風)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleContinue}
          disabled={isStreaming || !debateId}
        >
          {isStreaming ? '継続中...' : '討論を継続'}
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