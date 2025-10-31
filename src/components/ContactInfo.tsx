'use client';

import { useState } from 'react';
import { Copy, Phone, Mail } from 'lucide-react';

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
      <li className="leading-7 flex">
        <span className="font-semibold text-slate-900 whitespace-nowrap">오시는길 :</span>
        <span className="ml-2">
          <span>서울 강서구 공항대로 659</span>
          <br className="sm:hidden" />
          <span> 도레미빌딩 7층</span>
        </span>
      </li>
      <li>
        <div className={`flex items-center justify-between gap-2 ${copied === 'phone' ? 'text-[#ED6A26]' : ''}`}>
          <span className="flex items-center gap-2"><Phone size={14} className="text-[#ED6A26]" />{phoneNumber}</span>
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
          <span className="flex items-center gap-2"><Mail size={14} className="text-[#ED6A26]" />{email}</span>
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

