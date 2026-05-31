/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  X, 
  Sparkles, 
  CheckCircle, 
  MessageSquare,
  AlertCircle,
  Clock
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatWindowProps {
  jobId: string;
  jobTitle: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "provider" | "admin";
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  onClose: () => void;
}

export default function ChatWindow({
  jobId,
  jobTitle,
  senderId,
  senderName,
  senderRole,
  receiverId,
  receiverName,
  receiverAvatar,
  onClose
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?jobId=${jobId}&user1=${senderId}&user2=${receiverId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching messages", e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Poll messages every 4 seconds
    return () => clearInterval(interval);
  }, [jobId, senderId, receiverId]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, simulating]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          senderId,
          receiverId,
          content: messageText
        })
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setLoading(false);
    }
  };

  // AI Simulation Reply - Extremely powerful for reviewing
  const handleAISimulateReply = async () => {
    if (!input.trim() || simulating) return;

    const clientMsgText = input;
    setInput("");
    setSimulating(true);

    try {
      const response = await fetch("/api/messages/simulate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          senderId, // client
          receiverId, // provider
          content: clientMsgText
        })
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error simulating AI response", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden" id={`chat-window-${jobId}`}>
      {/* Thread Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-900 text-white">
        <div className="flex items-center space-x-3">
          <img 
            src={receiverAvatar} 
            className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/35" 
            alt={receiverName} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
            }}
          />
          <div>
            <span className="block text-sm font-bold tracking-tight">{receiverName}</span>
            <span className="block text-[10px] text-slate-400 font-sans tracking-wide truncate max-w-[180px]">
              Task: {jobTitle}
            </span>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          id="btn-close-chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        <div className="text-center">
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2.5 py-1 bg-slate-100 rounded-full">
            <Clock className="h-3 w-3" />
            Active Vault-Protected Thread
          </span>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No Messages Yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Send a greeting to align milestones, budget and begin execution.</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwn = msg.senderId === senderId;
          return (
            <div 
              key={msg.id || index} 
              className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              id={`msg-bubble-${index}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                  isOwn 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white text-gray-800 border border-slate-200 rounded-bl-none"
                }`}
              >
                {/* Message body */}
                <span className="block whitespace-pre-wrap leading-relaxed">{msg.content}</span>
              </div>
              <span className="text-[9px] text-gray-400 mt-1 font-mono tracking-wide">
                {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Dynamic AI typist simulation */}
        {simulating && (
          <div className="flex items-center gap-2 text-blue-605 bg-blue-50 border border-blue-100/50 rounded-2xl p-3 animate-in fade-in" id="ai-typing-indicator">
            <Sparkles className="h-4 w-4 animate-spin shrink-0 text-yellow-500" />
            <span className="text-[11px] font-semibold leading-none animate-pulse">
              Gemini is framing expert response as &quot;{receiverName}&quot;...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inline Help / Simulated Reply Quick Helper */}
      {senderRole === "client" && (
        <div className="bg-blue-50 border-t border-blue-100/50 p-2.5 flex items-center justify-between text-[11px]" id="tester-indicator-strip">
          <span className="text-blue-800 font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
            Reviewing flow helper enabled:
          </span>
          <button 
            type="button"
            onClick={handleAISimulateReply}
            disabled={!input.trim() || simulating}
            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-full cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-[10px] shadow-sm"
            id="btn-simulate-ai"
          >
            Send & Simulate Reply (AI)
          </button>
        </div>
      )}

      {/* Input Tray */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2" id="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={senderRole === "client" ? "Type instructions to discuss milestones..." : "Type response to client..."}
          className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          disabled={loading || simulating}
          id="chat-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || simulating}
          className="h-10 w-10 flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-blue-100"
          id="chat-send-btn"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
