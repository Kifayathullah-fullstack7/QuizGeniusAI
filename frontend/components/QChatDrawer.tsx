'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Lightbulb, HelpCircle, ArrowRight } from 'lucide-react';
import { sendQChatMessage, QChatMessage } from '@/lib/api';

interface QChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export default function QChatDrawer({ isOpen, onClose, initialTopic = 'Computer Science & Software Engineering' }: QChatDrawerProps) {
  const [messages, setMessages] = useState<QChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I'm **Q-Chat**, your AI Socratic Study Coach. I'm ready to help you master **${initialTopic}**! Ask me anything, or pick a prompt below to get started.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    'Explain the trickiest concept like I\'m 5',
    'Give me a memorable mnemonic',
    'Quiz me with a hard scenario question',
    'What common cognitive trap do people fall into?'
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: QChatMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await sendQChatMessage({
        message: text.trim(),
        topic: initialTopic,
        history: messages.slice(-4),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.suggested_followups && res.suggested_followups.length > 0) {
        setSuggestedFollowups(res.suggested_followups);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I had a brief hiccup connecting to the tutor engine. Try asking again, or let me know what specific area you would like to review!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0D0F18] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#11131F]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Q-Chat AI Tutor</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Socratic
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">
                Topic: {initialTopic}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
              <div 
                className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs shadow-md shadow-indigo-500/15' 
                    : 'bg-[#151827] text-slate-200 border border-white/5 rounded-bl-xs'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic pl-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Q-Chat is formulating a Socratic explanation...
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        {suggestedFollowups.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t border-white/5 bg-[#0F111C]/60">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              Suggested questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedFollowups.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-xs bg-[#1A1D2D] hover:bg-violet-600/20 text-slate-300 hover:text-violet-200 border border-white/10 hover:border-violet-500/30 px-2.5 py-1 rounded-full text-left transition-colors truncate max-w-full"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-[#11131F]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Q-Chat anything..."
              disabled={isLoading}
              className="flex-1 bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
