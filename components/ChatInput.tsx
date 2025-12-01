import React, { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          className="w-full pl-4 pr-12 py-3.5 bg-slate-100 border-none rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-inner"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isLoading ? (
                <div className="p-2 bg-slate-200 rounded-full">
                     <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                </div>
            ) : (
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={`
                        p-2 rounded-full transition-all duration-200 flex items-center justify-center
                        ${input.trim() 
                            ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }
                    `}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;