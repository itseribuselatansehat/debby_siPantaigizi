'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  Waves,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isPrivacyRefusal?: boolean;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Halo! Saya **Asisten AI SI PANTAI GIZI** dari Puskesmas Kepulauan Seribu Selatan.\n\nSaya siap membantu Anda menjawab data-data aplikasi seperti **jumlah pasien rawat inap, total tagihan makan, rincian biaya porsi, kapasitas kamar & bed, dan distribusi makanan**.\n\n*(Catatan Keamanan: Sesuai regulasi privasi rekam medis, sistem tidak menampilkan data NIK, nama lengkap pasien, dan diagnosa medis).*',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(100);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    messageCounterRef.current += 1;
    const currentCount = messageCounterRef.current;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${currentCount}`,
      sender: 'user',
      text,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();
      messageCounterRef.current += 1;
      const botMsg: ChatMessage = {
        id: `bot-${messageCounterRef.current}`,
        sender: 'bot',
        text: data.reply || 'Maaf, tidak dapat mengambil data saat ini. Silakan ulangi sesaat lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isPrivacyRefusal: data.isPrivacyRefusal,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      messageCounterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${messageCounterRef.current}`,
          sender: 'bot',
          text: 'Terjadi kendala koneksi dengan server AI. Silakan periksa jaringan Anda dan coba kembali.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    { label: '📊 Jumlah Pasien', prompt: 'Berapa jumlah pasien rawat inap saat ini?' },
    { label: '💰 Total Tagihan', prompt: 'Berapa total tagihan makan dan porsi yang terbit?' },
    { label: '🍽️ Tarif Porsi Makan', prompt: 'Bagaimana rincian tarif kontrak per porsi makan?' },
    { label: '🛏️ Kapasitas Kamar', prompt: 'Berapa kapasitas bed dan tempat tidur yang terisi?' },
  ];

  return (
    <div className="no-print">
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg border border-teal-500/30 backdrop-blur animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Tanya Data Gizi</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-slate-900 text-slate-300 hover:text-white'
              : 'bg-gradient-to-tr from-teal-800 via-teal-700 to-emerald-600 text-white shadow-teal-700/40 ring-4 ring-teal-500/20'
          }`}
          title={isOpen ? 'Tutup Asisten AI' : 'Buka Asisten AI SI PANTAI GIZI'}
          aria-label="Toggle Asisten AI"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-h-[620px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-4 text-white flex items-center justify-between border-b border-teal-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
                <Waves className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Asisten AI SI PANTAI GIZI</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    Live Data
                  </span>
                </div>
                <p className="text-[11px] text-teal-200/90 font-medium">Puskesmas Kepulauan Seribu Selatan</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Tutup jendela chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Security Banner */}
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Privasi Rekam Medis:</strong> Data NIK, Nama Pasien &amp; Diagnosa dirahasiakan.
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4 text-teal-200" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-teal-800 text-white rounded-br-none'
                      : msg.isPrivacyRefusal
                      ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-bl-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed text-[12px]">
                    {msg.text.split('**').map((chunk, index) =>
                      index % 2 === 1 ? <strong key={index}>{chunk}</strong> : chunk
                    )}
                  </div>
                  <span
                    className={`text-[9px] block text-right mt-1.5 ${
                      msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs pl-9">
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse delay-150"></div>
                <span className="text-[11px] font-medium text-teal-700">Menganalisis data aplikasi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 transition shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya jumlah pasien, tagihan, tarif..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-teal-800/20"
              title="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
