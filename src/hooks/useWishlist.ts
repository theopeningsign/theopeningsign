'use client';

import { useEffect, useState } from 'react';
import { getWishlist, WISHLIST_EVENT, type WishItem } from '@/lib/wishlist';

// 담은 포트폴리오 목록을 구독하는 훅 (변경 시 자동 반영, 다른 탭과도 동기화)
export function useWishlist(): WishItem[] {
	const [list, setList] = useState<WishItem[]>([]);

	useEffect(() => {
		const sync = () => setList(getWishlist());
		sync();
		window.addEventListener(WISHLIST_EVENT, sync);
		window.addEventListener('storage', sync);
		return () => {
			window.removeEventListener(WISHLIST_EVENT, sync);
			window.removeEventListener('storage', sync);
		};
	}, []);

	return list;
}
