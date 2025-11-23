'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

function AppHeaderComponent({
  title = 'MedConnect',
  showBack = false,
  onBack,
  rightContent,
}: AppHeaderProps) {
  return (
    <header className="sticky-header bg-white rounded-none md:rounded-xl shadow-sm">
      <div className="max-w-5xl mx-auto px-2 py-1.5 flex items-center gap-1.5">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-gray-800"
        >
          <Image
            src="/medconnect-logo.svg"
            alt="MedConnect logo"
            width={24}
            height={24}
            priority
          />
          <span className="text-sm font-bold text-gray-800">
            {title}
          </span>
        </Link>
      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/help"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={18} className="text-gray-600" />
        </Link>
        {rightContent}
      </div>
    </div>
  </header>
);
}

export const AppHeader = React.memo(AppHeaderComponent);

