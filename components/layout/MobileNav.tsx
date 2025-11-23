'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, MessageSquare, LogIn, GraduationCap, Menu, Shield, Building2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MobileNavProps {
  isAuthed: boolean;
  unreadConversations?: number;
  isAdmin?: boolean;
  onHome?: () => void;
  onPost?: () => void;
  onAccount?: () => void;
}

function MobileNavComponent({
  isAuthed,
  unreadConversations = 0,
  isAdmin = false,
  onHome,
  onPost,
  onAccount,
}: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleHome = () => {
    if (onHome) {
      onHome();
    }
  };

  const handlePost = () => {
    if (onPost) {
      onPost();
    }
  };

  const handleAccount = () => {
    setMenuOpen(false);
    if (onAccount) {
      onAccount();
    }
  };

  const handleDoctors = () => {
    setMenuOpen(false);
    router.push('/doctors');
  };

  const handleHospitals = () => {
    setMenuOpen(false);
    router.push('/hospitals');
  };

  const handleMessages = () => {
    setMenuOpen(false);
    router.push('/messages');
  };

  const handleAdmin = () => {
    setMenuOpen(false);
    router.push('/admin');
  };

  const handleHelp = () => {
    setMenuOpen(false);
    router.push('/help');
  };

  const messagesActive = pathname.startsWith('/messages');
  const doctorsActive = pathname.startsWith('/doctors');
  const hospitalsActive = pathname.startsWith('/hospitals');
  const adminActive = pathname.startsWith('/admin');

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white bottom-nav-safe">
      <div className="grid grid-cols-3 text-[10px]">
        <button
          type="button"
          className={cn('py-2 tap flex flex-col items-center gap-0.5 text-gray-600', pathname === '/' && 'text-blue-600')}
          onClick={handleHome}
        >
          <Home size={18} />
          <span>Home</span>
        </button>
        <button
          type="button"
          className="py-2 tap flex flex-col items-center gap-0.5 text-gray-600"
          onClick={handlePost}
        >
          <Plus size={18} />
          <span>Post</span>
        </button>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'py-2 tap flex flex-col items-center gap-0.5 text-gray-600',
                (doctorsActive || hospitalsActive || messagesActive || adminActive) && 'text-blue-600',
              )}
            >
              <Menu size={18} />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-sm">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={handleDoctors}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs',
                  doctorsActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700',
                )}
              >
                <GraduationCap size={18} />
                <span>Doctors</span>
              </button>
              <button
                type="button"
                onClick={handleHospitals}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs',
                  hospitalsActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700',
                )}
              >
                <Building2 size={18} />
                <span>Hospitals</span>
              </button>
              <button
                type="button"
                onClick={handleMessages}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors relative text-xs',
                  messagesActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700',
                )}
              >
                <MessageSquare size={18} />
                <span>Messages</span>
                {unreadConversations > 0 && !messagesActive && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5">
                    {unreadConversations > 9 ? '9+' : unreadConversations}
                  </span>
                )}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleAdmin}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs',
                    adminActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700',
                  )}
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleHelp}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 text-gray-700 transition-colors text-xs"
              >
                <HelpCircle size={18} />
                <span>Help</span>
              </button>
              <button
                type="button"
                onClick={handleAccount}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 text-gray-700 transition-colors text-xs"
              >
                <LogIn size={18} />
                <span>Account</span>
              </button>
            </div>
          </SheetContent>
      </Sheet>
    </div>
  </nav>
);
}

export const MobileNav = React.memo(MobileNavComponent);

