'use client';

import { useState } from 'react';

export default function ContactInfo() {
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
    <ul className="list-none space-y-1.5 text-slate-700 leading-7 pl-4">
      <li>
        <span className="font-semibold text-slate-900">오시는길</span> : 서울 강서구 공항대로 659 7층 (도레미빌딩)
      </li>
      <li>
        <button
          onClick={() => copyToClipboard(phoneNumber.replace(/\./g, ''), 'phone')}
          className={`relative cursor-pointer transition-colors hover:text-[#ED6A26] ${
            copied === 'phone' ? 'text-[#ED6A26]' : ''
          }`}
        >
          <span className="font-semibold text-slate-900">H.P</span> : {phoneNumber}
          {copied === 'phone' && (
            <span className="absolute left-full ml-2 text-xs font-medium whitespace-nowrap">copy</span>
          )}
        </button>
      </li>
      <li>
        <button
          onClick={() => copyToClipboard(email, 'email')}
          className={`relative cursor-pointer transition-colors hover:text-[#ED6A26] ${
            copied === 'email' ? 'text-[#ED6A26]' : ''
          }`}
        >
          <span className="font-semibold text-slate-900">E-mail</span> : {email}
          {copied === 'email' && (
            <span className="absolute left-full ml-2 text-xs font-medium whitespace-nowrap">copy</span>
          )}
        </button>
      </li>
    </ul>
  );
}

