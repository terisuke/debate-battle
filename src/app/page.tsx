'use client';

import { Message, useChat } from 'ai/react';
import { useState } from 'react';

interface AIAssistantMessage extends Message {
  data?: {
    side: 'pro' | 'con';
  };
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const { messages, append } = useChat<AIAssistantMessage>();

  const startDebate = async () => {
    await append({ role: 'user', content: topic });
    // 賛成派と反対派のAIを交互に呼び出す
    await append({ 
      role: 'assistant',
      content: '',
      data: { side: 'pro' }
    });
    await append({
      role: 'assistant', 
      content: '',
      data: { side: 'con' }
    });
  };

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border p-2 w-full"
          placeholder="討論テーマを入力"
        />
        <button 
          onClick={startDebate}
          className="bg-blue-500 text-white p-2 mt-2"
        >
          討論開始
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* 賛成派エリア */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">賛成派</h2>
          {messages
            .filter(m => m.data?.side === 'pro')
            .map((m, i) => (
              <div key={i} className="p-2 bg-gray-100 rounded mb-2">
                {m.content}
              </div>
            ))}
        </div>

        {/* 反対派エリア */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">反対派</h2>
          {messages
            .filter(m => m.data?.side === 'con')
            .map((m, i) => (
              <div key={i} className="p-2 bg-gray-100 rounded mb-2">
                {m.content}
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}