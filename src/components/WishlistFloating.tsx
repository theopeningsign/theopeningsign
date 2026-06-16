'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';

// 담은 포트폴리오가 1개 이상이면 하단 중앙에 떠서 상담신청으로 유도.
// (우하단 ContactFloating과 겹치지 않도록 하단 중앙 배치)
export default function WishlistFloating() {
	const list = useWishlist();
	const pathname = usePathname();

	if (list.length === 0) return null;
	if (pathname === '/contact') return null; // 상담 페이지에선 숨김

	return (
		<Link
			href="/contact"
			className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#D45720] px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-[#ED6A26]"
		>
			<Heart size={16} className="fill-white" />
			담은 포트폴리오 {list.length}개로 상담신청
		</Link>
	);
}
