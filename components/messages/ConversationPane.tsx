'use client';

import { FC } from 'react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string | null;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

interface ConversationPaneProps {
  messages: Message[];
  currentUserId?: string | null;
}

export const ConversationPane: FC<ConversationPaneProps> = ({
  messages,
  currentUserId,
}) => (
  <div className="flex flex-col gap-1.5">
    {messages.map((message) => {
      const isMine = String(message.author.id) === String(currentUserId);
      return (
        <div
          key={message.id}
          className={cn(
            'flex flex-col max-w-[80%] rounded-lg px-2 py-1 text-xs shadow-sm',
            isMine
              ? 'bg-blue-600 text-white self-end rounded-br-none'
              : 'bg-white text-gray-800 border border-gray-100 self-start rounded-bl-none',
          )}
        >
          <span className={cn('text-[10px] font-semibold', isMine ? 'text-blue-100' : 'text-gray-500')}>
            {message.author.firstName} {message.author.lastName}
          </span>
          {message.attachmentUrl && (
            <div className="mt-0.5">
              {message.type === 'image' ? (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.attachmentUrl}
                    alt={message.attachmentName || 'Conversation attachment'}
                    className="max-h-40 rounded-lg object-contain border border-white/40 transition-transform hover:scale-[1.02]"
                  />
                </a>
              ) : (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                    isMine
                      ? 'bg-blue-500/20 text-white hover:bg-blue-500/30'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                  )}
                >
                  📎 {message.attachmentName || 'Download attachment'}
                </a>
              )}
              {message.content && message.content.trim() && (
                <p className="mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed">{message.content}</p>
              )}
            </div>
          )}
          {!message.attachmentUrl && message.content && (
            <p className="mt-0.5 whitespace-pre-wrap text-[10px] leading-relaxed">{message.content}</p>
          )}
          <span className={cn('mt-0.5 text-[10px] uppercase tracking-wide', isMine ? 'text-blue-100/80' : 'text-gray-400')}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      );
    })}
    {!messages.length && (
      <div className="text-[10px] text-gray-400 text-center py-8">
        No messages yet. Say hello to start the conversation.
      </div>
    )}
  </div>
);

