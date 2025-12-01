
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, UserCircle, MessageCircle } from 'lucide-react';
import { GroupMessage, UserProfile } from '../types';
import { playClick } from '../services/sound';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: GroupMessage[];
  onSendMessage: (text: string) => void;
  user: UserProfile | null;
}

const MessagingModal: React.FC<MessagingModalProps> = ({ isOpen, onClose, messages, onSendMessage, user }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      playClick();
    }
  };

  const groupMessagesByDate = (msgs: GroupMessage[]) => {
      const groups: { [key: string]: GroupMessage[] } = {};
      msgs.forEach(msg => {
          const date = new Date(msg.timestamp).toLocaleDateString();
          if (!groups[date]) groups[date] = [];
          groups[date].push(msg);
      });
      return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-[#F5F5F7] dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col h-[80vh] max-h-[800px]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Team Chat</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Leaders & Volunteers</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/20 bg-[#F5F5F7] dark:bg-neutral-900">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No messages yet.</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm">Start the conversation!</p>
                </div>
            ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="flex justify-center mb-4">
                            <span className="bg-slate-200/60 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                {date === new Date().toLocaleDateString() ? 'Today' : date}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {msgs.map((msg, i) => {
                                const isMe = user && msg.senderId === user.id;
                                const showAvatar = !isMe && (i === 0 || msgs[i-1].senderId !== msg.senderId);

                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-8 h-8 ${!showAvatar && !isMe ? 'opacity-0' : ''}`}>
                                            {isMe ? null : (
                                                <div 
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${msg.senderColor}`}
                                                    title={msg.senderName}
                                                >
                                                    {msg.senderEmoji || msg.senderName.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {!isMe && showAvatar && (
                                                <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1">{msg.senderName}</span>
                                            )}
                                            <div 
                                                className={`
                                                    px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                                    ${isMe 
                                                        ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-tr-sm' 
                                                        : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-white/5'
                                                    }
                                                `}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className={`text-[9px] text-slate-400 dark:text-slate-500 mt-1 mx-1`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-white/10">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-3.5 bg-slate-100 dark:bg-white/5 border-none rounded-full text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-black transition-all"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`
                        p-3.5 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center
                        ${inputText.trim() 
                            ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-slate-200' 
                            : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }
                    `}
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
            </form>
        </div>

      </div>
    </div>
  );
};

export default MessagingModal;
