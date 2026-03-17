'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Terminal, Cpu, Zap } from 'lucide-react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', content: 'Core Engine Online. ระบบพร้อมทำงานแล้วครับ' }]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Error: เชื่อมต่อระบบไม่ได้' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 flex flex-col font-mono">
      {/* Header */}
      <nav className="border-b border-cyan-900/30 bg-black/50 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">CORE <span className="text-cyan-500">ENGINE</span></h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span> LIVE</div>
        </div>
      </nav>

      {/* Main Engine Room (Chat Area) */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-800 border-slate-700' : 'bg-cyan-900/20 border-cyan-500/30'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-cyan-400" />}
                </div>
                <div className={`p-4 rounded-xl border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900/50 border-slate-800 text-slate-300' 
                    : 'bg-cyan-950/10 border-cyan-900/50 text-cyan-50'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Control Panel (Input) */}
      <footer className="p-4 bg-gradient-to-t from-black to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-[#121214] border border-white/10 rounded-2xl p-2">
            <div className="pl-4 text-cyan-500/50"><Terminal size={18} /></div>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm placeholder:text-slate-600"
              placeholder="รันคำสั่งของคุณที่นี่..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isTyping}
              className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
