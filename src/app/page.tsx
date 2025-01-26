'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

type CustomMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  data?: {
    side: 'pro' | 'con';
  };
};

export default function Home() {
  const [topic, setTopic] = useState('');
  const { messages, append } = useChat<CustomMessage>({
    api: '/api/debate',
  });

  const startDebate = async () => {
    await append({ role: 'user', content: topic });
    
    // 賛成派と反対派を交互に呼び出す
    await Promise.all([
      append({ 
        role: 'assistant',
        content: '',
        data: { side: 'pro' }
      }),
      append({
        role: 'assistant', 
        content: '',
        data: { side: 'con' }
      })
    ]);
  };

  return (
    <main className="container mx-auto p-4">
      {/* ...UI部分は同じ... */}
      {messages
        .filter((m): m is CustomMessage => m.data?.side === 'pro')
        .map((m, i) => (
          <div key={i} className="p-2 bg-gray-100 rounded mb-2">
            {m.content}
          </div>
        ))}
    </main>
  );
}