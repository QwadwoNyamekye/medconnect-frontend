'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ConversationPane } from '@/components/messages/ConversationPane';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, XCircle, Paperclip } from 'lucide-react';
import { conversationsAPI } from '@/lib/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRouter, useParams } from 'next/navigation';

interface ConversationDetails {
  id: string;
  title?: string;
  isGroup: boolean;
  unreadCount?: number;
  createdBy?: string;
  participantLinks: Array<{
    role: 'member' | 'admin';
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      specialty?: string;
    };
  }>;
  messages: Array<{
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
}

const useConversationDetails = (conversationId?: string | null) => {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }
    const fetchConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await conversationsAPI.get(conversationId);
        setConversation(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [conversationId]);

  return { conversation, loading, error, setConversation };
};

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const {
    conversation,
    loading: loadingConversation,
    error: conversationError,
    setConversation,
  } = useConversationDetails(conversationId);

  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [unreadConversations, setUnreadConversations] = useState<number>(0);

  const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB

  // Fetch unread conversations count
  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadConversations(0);
      return;
    }

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const response = await conversationsAPI.list();
        if (cancelled) return;
        const totalUnread = Array.isArray(response)
          ? response.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0)
          : 0;
        setUnreadConversations(totalUnread);
      } catch (error) {
        if (!cancelled) {
          setUnreadConversations(0);
        }
      }
    };

    fetchUnread();

    const handler = () => {
      fetchUnread();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('conversations-updated', handler);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('conversations-updated', handler);
      }
    };
  }, [currentUser?.id]);

  // Update browser tab title with unread count
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (unreadConversations > 0) {
      document.title = `(${unreadConversations}) MedConnect`;
    } else {
      document.title = 'MedConnect';
    }
  }, [unreadConversations]);

  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);

  useEffect(() => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview(null);
    setAttachmentError(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, [conversationId]);

  const emitConversationsUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('conversations-updated'));
    }
  };

  const handleAttachmentSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setAttachmentError('Attachment must be 15MB or smaller.');
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      return;
    }

    setAttachmentError(null);

    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }

    setAttachment(file);

    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setAttachmentPreview(previewUrl);
    } else {
      setAttachmentPreview(null);
    }
  };

  const clearAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
      setAttachmentPreview(null);
    }
    setAttachment(null);
    setAttachmentError(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = messageDraft.trim();
    if (!conversationId || (!trimmedMessage && !attachment)) return;
    try {
      setSendingMessage(true);
      const newMessage = await conversationsAPI.postMessage(
        conversationId,
        {
          content: trimmedMessage || undefined,
          attachment: attachment || undefined,
        },
      );
      setConversation((prev) => (prev
        ? { ...prev, messages: [...prev.messages, newMessage] }
        : prev));
      setMessageDraft('');
      clearAttachment();
      emitConversationsUpdated();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const selectedConversationParticipants = useMemo(() => {
    if (!conversation) return [];
    return conversation.participantLinks
      .map((link) => link.user)
      .filter((user) => String(user.id) !== String(currentUser?.id));
  }, [conversation, currentUser?.id]);

  useEffect(() => {
    if (!conversation || !conversationId) return;
    const updateUnread = async () => {
      emitConversationsUpdated();
    };
    updateUnread();
  }, [conversation?.messages?.length, conversationId]);

  const participantCount = conversation?.participantLinks
    ? conversation.participantLinks.length
    : selectedConversationParticipants.length + (currentUser?.id ? 1 : 0);

  const handleBack = () => {
    router.push('/messages');
  };

  const isAuthed = Boolean(currentUser?.id);

  const handleHomeNav = () => {
    router.push('/');
  };

  const handlePostNav = () => {
    router.push('/?view=post');
  };

  const handleAccountNav = () => {
    if (typeof window !== 'undefined') {
      if (isAuthed) {
        localStorage.setItem('medconnect-open-profile', '1');
        window.dispatchEvent(new Event('medconnect-open-profile'));
      } else {
        localStorage.setItem('medconnect-show-auth', '1');
        window.dispatchEvent(new Event('medconnect-show-auth'));
      }
    }
    router.push('/');
  };

  return (
    <AppLayout
      isAuthed={isAuthed}
      unreadConversations={unreadConversations}
      isAdmin={currentUser?.role === 'admin'}
      onHome={handleHomeNav}
      onPost={handlePostNav}
      onAccount={handleAccountNav}
    >
      {/* Mobile Header */}
      <div className="sm:hidden">
        <AppHeader showBack onBack={handleBack} />
      </div>
      <div className="sm:max-w-5xl mx-auto px-2 sm:px-0 py-2">
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)]">
              <div className="px-2 py-1 border-b border-gray-200 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-gray-800 truncate">
                    {conversation?.title ||
                      selectedConversationParticipants
                        .filter((user, index, arr) => arr.findIndex((u) => u.id === user.id) === index)
                        .map((user) => `${user.firstName} ${user.lastName}`)
                        .join(', ') ||
                      'Conversation'}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {participantCount > 2
                      ? `${participantCount} participants`
                      : 'Direct conversation'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-1.5 bg-gradient-to-br from-blue-50/30 via-white to-white">
                {conversationError && (
                  <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 mb-2">
                    {conversationError}
                  </div>
                )}
                {loadingConversation ? (
                  <div className="text-[10px] text-gray-400 text-center py-8">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    <p className="mt-1.5">Loading messages...</p>
                  </div>
                ) : conversation ? (
                  <ConversationPane
                    messages={conversation.messages}
                    currentUserId={currentUser?.id}
                  />
                ) : (
                  <div className="text-[10px] text-gray-400 text-center py-8">
                    Conversation not found or inaccessible.
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-1.5">
                {attachment && (
                  <div className="mb-1.5 flex items-center justify-between gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 p-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {attachmentPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={attachmentPreview}
                          alt={attachment.name}
                          className="h-8 w-8 rounded-lg object-cover border border-blue-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs flex-shrink-0">
                          📎
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-blue-900 truncate">
                          {attachment.name}
                        </p>
                        <p className="text-[10px] text-blue-700/70">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="text-blue-700 hover:text-blue-900 transition-colors flex-shrink-0"
                      aria-label="Remove attachment"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {attachmentError && (
                  <p className="mb-1 text-[10px] text-red-600">{attachmentError}</p>
                )}
                <div className="flex items-end gap-1">
                  <div className="flex flex-1 items-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-6 w-6"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={sendingMessage}
                    >
                      <Paperclip className="w-3 h-3" />
                    </Button>
                    <Textarea
                      placeholder="Write a message..."
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      rows={2}
                      className="flex-1 text-[10px] leading-relaxed"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!messageDraft.trim() && !attachment)}
                    className="self-end h-6 text-[10px] px-2"
                    size="sm"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-2.5 h-2.5 mr-1" />
                    )}
                    Send
                  </Button>
                </div>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentSelect}
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                />
              </div>
            </div>
          </div>
        </div>
    </AppLayout>
  );
}

