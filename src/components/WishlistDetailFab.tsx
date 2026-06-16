'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isInWishlist, toggleWishlist, WISHLIST_EVENT } from '@/lib/wishlist';

// 상세페이지용 담기 플로팅 버튼 — 뒤로가기 플로팅 버튼 바로 아래에 위치.
// 스크롤을 내려도 항상 담을 수 있게 한다.
export default function WishlistDetailFab({ id, title }: { id: string; title: string }) {
	const [saved, setSaved] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	// 담기 상태 동기화
	useEffect(() => {
		const sync = () => setSaved(isInWishlist(id));
		sync();
		window.addEventListener(WISHLIST_EVENT, sync);
		window.addEventListener('storage', sync);
		return () => {
			window.removeEventListener(WISHLIST_EVENT, sync);
			window.removeEventListener('storage', sync);
		};
	}, [id]);

	// 스크롤 내리면 표시 (뒤로가기 플로팅과 동일한 타이밍)
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 120);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<button
			type="button"
			onClick={() => toggleWishlist({ id, title })}
			aria-label={saved ? '상담 목록에서 빼기' : '상담 목록에 담기'}
			className={`fixed left-4 top-32 z-[100] inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm transition-all duration-200 ${
				scrolled ? 'opacity-100 translate-x-0' : 'pointer-events-none -translate-x-full opacity-0'
			} ${saved ? 'bg-[#ED6A26] text-white hover:bg-[#D45720]' : 'bg-white/95 text-slate-700 hover:bg-white'}`}
		>
			<Heart size={16} className={saved ? 'fill-white' : 'text-[#ED6A26]'} />
			{saved ? '담음' : '상담 담기'}
		</button>
	);
}
