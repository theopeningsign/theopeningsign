'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const STALE_TIME = 30 * 60 * 1000; // 30분

export default function AutoRefresh() {
	const router = useRouter();
	const pathname = usePathname();
	const hasRefreshed = useRef(false);
	const loadTime = useRef(Date.now());

	// 포트폴리오 상세 페이지 진입 시 1회 새로고침 (기존 로직)
	useEffect(() => {
		if (pathname?.startsWith('/portfolio/') && pathname !== '/portfolio') {
			const refreshKey = `refreshed_${pathname}`;
			const hasRefreshedBefore = sessionStorage.getItem(refreshKey);

			if (!hasRefreshedBefore && !hasRefreshed.current) {
				hasRefreshed.current = true;
				requestAnimationFrame(() => {
					sessionStorage.setItem(refreshKey, 'true');
					if (typeof window !== 'undefined') {
						window.location.reload();
					}
				});
			}
		}
	}, [router, pathname]);

	// 탭 활성화 시 30분 경과했으면 새로고침 (Notion 이미지 URL 만료 대응)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				const elapsed = Date.now() - loadTime.current;
				if (elapsed > STALE_TIME) {
					router.refresh();
					loadTime.current = Date.now();
				}
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [router]);

	return null;
}

