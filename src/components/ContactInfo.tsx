'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

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
        <div className={`flex items-center justify-between gap-2 ${copied === 'phone' ? 'text-[#ED6A26]' : ''}`}>
          <span><span className="font-semibold text-slate-900">H.P</span> : {phoneNumber}</span>
          <button
            aria-label="전화번호 복사"
            onClick={() => copyToClipboard(phoneNumber.replace(/\./g, ''), 'phone')}
            className="p-1 rounded hover:bg-slate-100 active:scale-95 transition"
          >
            <Copy size={16} className={copied === 'phone' ? 'text-[#ED6A26]' : 'text-slate-600'} />
          </button>
        </div>
      </li>
      <li>
        <div className={`flex items-center justify-between gap-2 ${copied === 'email' ? 'text-[#ED6A26]' : ''}`}>
          <span><span className="font-semibold text-slate-900">E-mail</span> : {email}</span>
          <button
            aria-label="이메일 복사"
            onClick={() => copyToClipboard(email, 'email')}
            className="p-1 rounded hover:bg-slate-100 active:scale-95 transition"
          >
            <Copy size={16} className={copied === 'email' ? 'text-[#ED6A26]' : 'text-slate-600'} />
          </button>
        </div>
      </li>
    </ul>
  );
}

