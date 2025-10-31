'use client';

import { useState } from 'react';

export default function ContactFloating() {
  const [copied, setCopied] = useState<'phone' | 'email' | null>(null);

  const phoneNumber = '010.2366.5876';
  const email = 'theopensign@gmail.com';

  const copyToClipboard = async (text: string, type: 'phone' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 md:px-4 md:py-3 text-left shadow-lg backdrop-blur-sm max-w-[calc(100vw-2rem)]">
      <div className="mb-1 text-[10px] md:text-xs font-semibold tracking-wider" style={{ color: '#ED6A26' }}>
        CONTACT US
      </div>
      <button
        onClick={() => copyToClipboard(phoneNumber.replace(/\./g, ''), 'phone')}
        className={`relative block w-full cursor-pointer text-left transition-colors hover:text-[#ED6A26] ${
          copied === 'phone' ? 'text-[#ED6A26]' : 'text-slate-700'
        }`}
      >
        <p className="text-sm text-left">
          H.P: {phoneNumber}
          {copied === 'phone' && (
            <span className="absolute left-full ml-2 text-xs font-medium whitespace-nowrap">copy</span>
          )}
        </p>
      </button>
      <button
        onClick={() => copyToClipboard(email, 'email')}
        className={`relative mt-2 block w-full cursor-pointer text-left transition-colors hover:text-[#ED6A26] ${
          copied === 'email' ? 'text-[#ED6A26]' : 'text-slate-700'
        }`}
      >
        <p className="text-sm text-left">
          이메일: {email}
          {copied === 'email' && (
            <span className="absolute left-full ml-2 text-xs font-medium whitespace-nowrap">copy</span>
          )}
        </p>
      </button>
    </div>
  );
}

