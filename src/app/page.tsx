export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">AI討論バトル</h1>
      <div className="grid grid-cols-2 gap-4">
        {/* 賛成派エリア */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">賛成派</h2>
        </div>
        
        {/* 反対派エリア */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">反対派</h2>
        </div>
      </div>
    </main>
  );
}