import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
          ${isUser ? 'bg-indigo-600' : isError ? 'bg-red-500' : 'bg-emerald-600'}
        `}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Bubble */}
        <div className={`
          flex flex-col
          ${isUser ? 'items-end' : 'items-start'}
        `}>
          <div className={`
            rounded-2xl py-3 px-4 shadow-sm text-sm leading-relaxed overflow-hidden
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : isError
                ? 'bg-red-50 border border-red-100 text-red-800 rounded-tl-none'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
            }
          `}>
             <div className={`markdown-body ${isUser ? 'text-white' : 'text-slate-700'}`}>
                {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <ReactMarkdown 
                        components={{
                            code({node, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                    <div className="bg-slate-900 rounded-md p-3 my-2 overflow-x-auto border border-slate-700">
                                        <code className={`${className} text-xs font-mono text-slate-100`} {...props}>
                                            {children}
                                        </code>
                                    </div>
                                ) : (
                                    <code className="bg-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            ul: ({children}) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                            h1: ({children}) => <h1 className="text-lg font-bold my-2">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-bold my-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-bold my-1">{children}</h3>,
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            a: ({children, href}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{children}</a>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-slate-300 pl-3 italic my-2">{children}</blockquote>
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                )}
             </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;