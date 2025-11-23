'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Plus, MessageSquare, LogIn, GraduationCap, Shield, User, Building2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopNavProps {
  isAuthed: boolean;
  unreadConversations?: number;
  isAdmin?: boolean;
  onHome?: () => void;
  onPost?: () => void;
  onAccount?: () => void;
}

function DesktopNavComponent({
  isAuthed,
  unreadConversations = 0,
  isAdmin = false,
  onHome,
  onPost,
  onAccount,
}: DesktopNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      router.push('/');
    }
  };

  const handlePost = () => {
    if (onPost) {
      onPost();
    } else {
      router.push('/?view=post');
    }
  };

  const handleAccount = () => {
    if (onAccount) {
      onAccount();
    } else {
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
    }
  };

  const homeActive = pathname === '/';
  const messagesActive = pathname.startsWith('/messages');
  const doctorsActive = pathname.startsWith('/doctors');
  const hospitalsActive = pathname.startsWith('/hospitals');
  const adminActive = pathname.startsWith('/admin');

  return (
    <nav className="hidden sm:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/medconnect-logo.svg"
            alt="MedConnect logo"
            width={32}
            height={32}
            priority
          />
          <span className="text-lg font-bold text-gray-800">MedConnect</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-1">
        <button
          type="button"
          onClick={handleHome}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            homeActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50',
          )}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={handlePost}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Plus size={20} />
          <span>Post Case</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/doctors')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            doctorsActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50',
          )}
        >
          <GraduationCap size={20} />
          <span>Doctors</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/hospitals')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            hospitalsActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50',
          )}
        >
          <Building2 size={20} />
          <span>Hospitals</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/messages')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
            messagesActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50',
          )}
        >
          <MessageSquare size={20} />
          <span>Messages</span>
          {unreadConversations > 0 && !messagesActive && (
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold px-2 py-0.5 min-w-[20px]">
              {unreadConversations > 9 ? '9+' : unreadConversations}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              adminActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50',
            )}
          >
            <Shield size={20} />
            <span>Admin</span>
          </button>
        )}

        <div className="pt-4 border-t border-gray-200 mt-4 space-y-1">
          <button
            type="button"
            onClick={() => router.push('/help')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <HelpCircle size={20} />
            <span>Help</span>
          </button>
          <button
            type="button"
            onClick={handleAccount}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isAuthed ? <User size={20} /> : <LogIn size={20} />}
            <span>{isAuthed ? 'Account' : 'Login'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export const DesktopNav = React.memo(DesktopNavComponent);

