'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isInWishlist, toggleWishlist, WISHLIST_EVENT } from '@/lib/wishlist';

// 상세페이지용 "이 느낌으로 상담 담기" 버튼
export default function WishlistButton({ id, title }: { id: string; title: string }) {
	const [saved, setSaved] = useState(false);

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

	return (
		<button
			type="button"
			onClick={() => toggleWishlist({ id, title })}
			className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
				saved
					? 'border-[#ED6A26] bg-orange-50 text-[#ED6A26]'
					: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
			}`}
		>
			<Heart size={16} className={saved ? 'fill-[#ED6A26] text-[#ED6A26]' : ''} />
			{saved ? '상담 목록에 담음' : '이 느낌으로 상담 담기'}
		</button>
	);
}
