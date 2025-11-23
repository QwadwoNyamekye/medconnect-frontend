'use client';

import { FC } from 'react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Array<{
    id: string;
    title?: string;
    isGroup: boolean;
    unreadCount: number;
    updatedAt: string;
    participantLinks: Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
        profilePicture?: string;
        specialty?: string;
      };
      userId: string;
    }>;
    messages?: Array<{
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
    }>;
  }>;
  currentUserId?: string | null;
  onSelect: (conversationId: string) => void;
}

const getConversationName = (
  conversation: ConversationListProps['conversations'][number],
  currentUserId?: string | null,
) => {
  if (conversation.title) return conversation.title;
  const otherParticipants = conversation.participantLinks
    .map((link) => link.user)
    .filter((user) => String(user.id) !== String(currentUserId));

  if (!otherParticipants.length && conversation.participantLinks.length) {
    const self = conversation.participantLinks[0].user;
    return `${self.firstName} ${self.lastName}`;
  }

  return otherParticipants
    .slice(0, 3)
    .map((user) => `${user.firstName} ${user.lastName}`)
    .join(', ') || 'Conversation';
};

const getLastMessagePreview = (
  conversation: ConversationListProps['conversations'][number],
) => {
  const messages = conversation.messages || [];
  if (!messages.length) return 'No messages yet';
  const last = messages[messages.length - 1];
  if (last.attachmentUrl) {
    const label =
      last.type === 'image'
        ? 'sent an image'
        : `sent ${last.attachmentName || 'an attachment'}`;
    if (last.content && last.content.trim()) {
      return `${last.author.firstName}: ${last.content.trim()}`;
    }
    return `${last.author.firstName} ${label}`;
  }
  const text = last.content ? last.content.trim() : '';
  if (text) {
    return `${last.author.firstName}: ${text}`;
  }
  return `${last.author.firstName} sent a message`;
};

export const ConversationList: FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelect,
}) => (
  <div className="space-y-1">
    {conversations.map((conversation) => (
      <button
        key={conversation.id}
        type="button"
        onClick={() => onSelect(conversation.id)}
        className={cn(
          'w-full text-left rounded-lg border px-2 py-1 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col gap-0.5',
          conversation.unreadCount > 0
            ? 'border-blue-500 bg-blue-50/60'
            : 'border-gray-200 hover:bg-gray-50',
        )}
      >
        <div className="flex items-center justify-between gap-1.5">
          <h4 className="text-xs font-semibold text-gray-800 truncate">
            {getConversationName(conversation, currentUserId)}
          </h4>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {new Date(conversation.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <p
            className={cn(
              'text-[10px] text-gray-500 truncate flex-1',
              conversation.unreadCount > 0 && 'font-semibold text-gray-700',
            )}
          >
            {getLastMessagePreview(conversation)}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center text-[10px] font-semibold text-white bg-blue-600 rounded-full px-1 py-0.5 min-w-[16px] h-4 flex-shrink-0">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </button>
    ))}
    {!conversations.length && (
      <div className="text-[10px] text-gray-500 text-center py-5 border border-dashed border-gray-200 rounded-lg">
        No conversations yet. Start one to connect with colleagues.
      </div>
    )}
  </div>
);

