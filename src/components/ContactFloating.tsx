'use client';

import { useState } from 'react';
import { Copy, Phone, Mail } from 'lucide-react';

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
      <div className={`flex items-center justify-between gap-2 ${copied === 'phone' ? 'text-[#ED6A26]' : 'text-slate-700'}`}>
        <span className="text-sm flex items-center gap-2">
          <Phone size={14} className="text-[#ED6A26]" />
          {phoneNumber}
        </span>
        <button
          aria-label="전화번호 복사"
          onClick={() => copyToClipboard(phoneNumber.replace(/\./g, ''), 'phone')}
          className="p-1 rounded hover:bg-slate-100 active:scale-95 transition"
        >
          <Copy size={16} className={copied === 'phone' ? 'text-[#ED6A26]' : 'text-slate-600'} />
        </button>
      </div>
      <div className={`mt-2 flex items-center justify-between gap-2 ${copied === 'email' ? 'text-[#ED6A26]' : 'text-slate-700'}`}>
        <span className="text-sm flex items-center gap-2">
          <Mail size={14} className="text-[#ED6A26]" />
          {email}
        </span>
        <button
          aria-label="이메일 복사"
          onClick={() => copyToClipboard(email, 'email')}
          className="p-1 rounded hover:bg-slate-100 active:scale-95 transition"
        >
          <Copy size={16} className={copied === 'email' ? 'text-[#ED6A26]' : 'text-slate-600'} />
        </button>
      </div>
    </div>
  );
}

