'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ConversationList } from '@/components/messages/ConversationList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Send, Loader2, MessageSquare, RefreshCw, Search, XCircle, Paperclip } from 'lucide-react';
import { useConversations } from '@/lib/hooks/useConversations';
import { useUsers } from '@/lib/hooks/useUsers';
import { conversationsAPI } from '@/lib/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const emitConversationsUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('conversations-updated'));
    }
  };

  const router = useRouter();

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

  const { conversations, loading: loadingConversations, error: conversationsError, refresh } = useConversations();

  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<Array<{ id: string; firstName: string; lastName: string; specialty?: string; hospital?: string }>>([]);
  const [newConversationAttachment, setNewConversationAttachment] = useState<File | null>(null);
  const [newConversationAttachmentPreview, setNewConversationAttachmentPreview] = useState<string | null>(null);
  const [newConversationAttachmentError, setNewConversationAttachmentError] = useState<string | null>(null);
  const newConversationAttachmentInputRef = useRef<HTMLInputElement>(null);

  const { users: allUsers, loading: loadingUsers, error: usersError, search } = useUsers();
  const availableUsers = useMemo(() => {
    const currentId = currentUser?.id ? String(currentUser.id) : null;
    const selectedIds = new Set(selectedParticipants.map((u) => String(u.id)));
    return allUsers.filter((user) => {
      const userId = String(user.id);
      if (currentId && userId === currentId) return false;
      if (selectedIds.has(userId)) return false;
      return true;
    });
  }, [allUsers, selectedParticipants, currentUser?.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      search(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, search]);

  useEffect(() => {
    if (!showNewConversation) {
      setSelectedParticipants([]);
      setNewConversationTitle('');
      setNewConversationMessage('');
      setSearchTerm('');
      if (newConversationAttachmentPreview) {
        URL.revokeObjectURL(newConversationAttachmentPreview);
      }
      setNewConversationAttachment(null);
      setNewConversationAttachmentPreview(null);
      setNewConversationAttachmentError(null);
      if (newConversationAttachmentInputRef.current) {
        newConversationAttachmentInputRef.current.value = '';
      }
    }
  }, [showNewConversation, newConversationAttachmentPreview]);


  useEffect(() => {
    return () => {
      if (newConversationAttachmentPreview) {
        URL.revokeObjectURL(newConversationAttachmentPreview);
      }
    };
  }, [newConversationAttachmentPreview]);


  const isAuthed = Boolean(currentUser?.id);
  const unreadConversations = useMemo(
    () =>
      conversations.reduce((total, conversation) => {
        return total + (conversation.unreadCount || 0);
      }, 0),
    [conversations],
  );

  // Update browser tab title with unread count
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (unreadConversations > 0) {
      document.title = `(${unreadConversations}) MedConnect`;
    } else {
      document.title = 'MedConnect';
    }
  }, [unreadConversations]);

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

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB

  const handleNewConversationAttachmentSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    setNewConversationAttachmentError('Attachment must be 15MB or smaller.');
    if (newConversationAttachmentInputRef.current) {
      newConversationAttachmentInputRef.current.value = '';
    }
    return;
  }

  setNewConversationAttachmentError(null);

  if (newConversationAttachmentPreview) {
    URL.revokeObjectURL(newConversationAttachmentPreview);
  }

  setNewConversationAttachment(file);

  if (file.type.startsWith('image/')) {
    const previewUrl = URL.createObjectURL(file);
    setNewConversationAttachmentPreview(previewUrl);
  } else {
    setNewConversationAttachmentPreview(null);
  }
};

const clearNewConversationAttachment = () => {
  if (newConversationAttachmentPreview) {
    URL.revokeObjectURL(newConversationAttachmentPreview);
  }
  setNewConversationAttachment(null);
  setNewConversationAttachmentPreview(null);
  setNewConversationAttachmentError(null);
  if (newConversationAttachmentInputRef.current) {
    newConversationAttachmentInputRef.current.value = '';
  }
};


  const handleCreateConversation = async () => {
    const participantIds = selectedParticipants.map((participant) => participant.id);

    if (!participantIds.length) return;

    const trimmedInitialMessage = newConversationMessage.trim();

    if (!trimmedInitialMessage && !newConversationAttachment) {
      setNewConversationAttachmentError('Please add a message or attachment to start the conversation.');
      return;
    }

    try {
      setCreatingConversation(true);
      setNewConversationAttachmentError(null);
      const messagePayload =
        trimmedInitialMessage || newConversationAttachment
          ? {
              content: trimmedInitialMessage || undefined,
              type: newConversationAttachment
                ? newConversationAttachment.type.startsWith('image/')
                  ? 'image'
                  : 'file'
                : 'text',
              attachment: newConversationAttachment || undefined,
            }
          : undefined;

      const newConversation = await conversationsAPI.create({
        participantIds,
        title: participantIds.length > 1 ? newConversationTitle.trim() : undefined,
        message: messagePayload,
      });

      setShowNewConversation(false);
      setSelectedParticipants([]);
      setNewConversationTitle('');
      setNewConversationMessage('');
      setSearchTerm('');
      clearNewConversationAttachment();
      await refresh();
      emitConversationsUpdated();
      router.push(`/messages/${newConversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation', error);
    } finally {
      setCreatingConversation(false);
    }
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
        <AppHeader />
      </div>
      <div className="sm:max-w-5xl mx-auto px-2 sm:px-0 py-2 space-y-2">
          <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <h1 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                  <MessageSquare className="text-blue-600" size={18} />
                  Conversations
                </h1>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refresh}
                    disabled={loadingConversations}
                    className="rounded-full h-7 w-7"
                    aria-label="Refresh conversations"
                  >
                    {loadingConversations ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Sheet open={showNewConversation} onOpenChange={setShowNewConversation}>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                        aria-label="Start conversation"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle className="text-sm">Start a Conversation</SheetTitle>
                      </SheetHeader>
                      <div className="mt-3 space-y-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Search colleagues..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="flex-1"
                            />
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                          {usersError && (
                            <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                              {usersError}
                            </div>
                          )}
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50/60">
                            {loadingUsers ? (
                              <div className="flex items-center justify-center py-4 text-[10px] text-gray-500">
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Loading users...
                              </div>
                            ) : availableUsers.length ? (
                              <ul className="divide-y divide-gray-200 text-xs">
                                {availableUsers.slice(0, 25).map((user) => (
                                  <li key={user.id} className="px-2 py-1.5 flex items-center justify-between gap-1.5 hover:bg-gray-100/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-gray-700 truncate text-xs">{user.firstName} {user.lastName}</p>
                                      <p className="text-[10px] text-gray-500 truncate">{user.specialty || '—'} · {user.hospital || '—'}</p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-shrink-0 h-6 text-[10px] px-2"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedParticipants((prev) => {
                                          // Prevent duplicates
                                          const exists = prev.some((p) => String(p.id) === String(user.id));
                                          if (exists) return prev;
                                          return [...prev, user];
                                        });
                                      }}
                                    >
                                      Add
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-[10px] text-gray-500 text-center py-5">
                                No users found.
                              </div>
                            )}
                          </div>
                          {selectedParticipants.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 bg-blue-50 border border-blue-100 rounded-xl p-2">
                              {selectedParticipants.map((participant) => (
                                <span key={participant.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-blue-200 px-2 py-0.5 text-[10px] text-blue-700">
                                  {participant.firstName} {participant.lastName}
                                  <button
                                    aria-label={`Remove ${participant.firstName}`}
                                    onClick={() => setSelectedParticipants((prev) => prev.filter((p) => p.id !== participant.id))}
                                  >
                                    <XCircle className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Input
                          placeholder="Conversation title (optional for groups)"
                          value={newConversationTitle}
                          onChange={(e) => setNewConversationTitle(e.target.value)}
                          className="h-9 text-xs"
                        />
                        <Textarea
                          placeholder="First message (optional)"
                          value={newConversationMessage}
                          onChange={(e) => setNewConversationMessage(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                        {newConversationAttachment && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2">
                            <div className="flex items-center gap-2">
                              {newConversationAttachmentPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={newConversationAttachmentPreview}
                                  alt={newConversationAttachment.name}
                                  className="h-12 w-12 rounded-lg object-cover border border-blue-200"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-sm">
                                  📎
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-[10px] font-semibold text-blue-900 truncate">
                                  {newConversationAttachment.name}
                                </p>
                                <p className="text-[10px] text-blue-700/70">
                                  {(newConversationAttachment.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={clearNewConversationAttachment}
                                className="text-blue-700 hover:text-blue-900 transition-colors"
                                aria-label="Remove attachment"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        {newConversationAttachmentError && (
                          <p className="text-[10px] text-red-600">{newConversationAttachmentError}</p>
                        )}
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => newConversationAttachmentInputRef.current?.click()}
                            className="flex items-center gap-1.5 h-7 text-[10px]"
                            disabled={creatingConversation}
                          >
                            <Paperclip className="w-3 h-3" />
                            Add attachment
                          </Button>
                          <input
                            ref={newConversationAttachmentInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleNewConversationAttachmentSelect}
                            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                          />
                        </div>
                        <Button
                          onClick={handleCreateConversation}
                          disabled={creatingConversation || selectedParticipants.length === 0}
                          size="sm"
                          className="h-7 text-xs"
                        >
                          {creatingConversation ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Send className="w-3 h-3 mr-1.5" />}
                          Start Conversation
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {conversationsError && (
                <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 mb-2">
                  {conversationsError}
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 space-y-1.5">
                {loadingConversations ? (
                  <div className="text-[10px] text-gray-400 text-center py-6">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    <p className="mt-1.5">Loading conversations...</p>
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    currentUserId={currentUser?.id}
                    onSelect={handleSelectConversation}
                  />
                )}
              </div>
          </div>
        </div>
    </AppLayout>
  );
}

