'use client';

import React from 'react';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: React.ReactNode;
  isAuthed: boolean;
  unreadConversations?: number;
  isAdmin?: boolean;
  onHome?: () => void;
  onPost?: () => void;
  onAccount?: () => void;
}

export function AppLayout({
  children,
  isAuthed,
  unreadConversations = 0,
  isAdmin = false,
  onHome,
  onPost,
  onAccount,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <DesktopNav
        isAuthed={isAuthed}
        unreadConversations={unreadConversations}
        isAdmin={isAdmin}
        onHome={onHome}
        onPost={onPost}
        onAccount={onAccount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <main className="flex-1 overflow-y-auto">
          {/* Mobile: Full width with padding */}
          <div className="sm:hidden">
            {children}
          </div>
          {/* Desktop: Centered content with max-width */}
          <div className="hidden sm:block">
            <div className="w-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        isAuthed={isAuthed}
        unreadConversations={unreadConversations}
        isAdmin={isAdmin}
        onHome={onHome}
        onPost={onPost}
        onAccount={onAccount}
      />
    </div>
  );
}

