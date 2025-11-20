'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AutoRefresh() {
	const router = useRouter();
	const pathname = usePathname();
	const hasRefreshed = useRef(false);

	useEffect(() => {
		// 포트폴리오 상세 페이지에서만 작동
		if (pathname?.startsWith('/portfolio/') && pathname !== '/portfolio') {
			// 이 페이지에서 이미 새로고침했는지 확인
			const refreshKey = `refreshed_${pathname}`;
			const hasRefreshedBefore = sessionStorage.getItem(refreshKey);

			if (!hasRefreshedBefore && !hasRefreshed.current) {
				hasRefreshed.current = true;
				
				// 즉시 새로고침 (이미지 로딩 문제 해결)
				// window.location.reload()로 완전 새로고침하여 새로운 이미지 URL 가져오기
				requestAnimationFrame(() => {
					sessionStorage.setItem(refreshKey, 'true');
					// router.refresh()는 캐시된 데이터를 사용할 수 있어서 window.location.reload() 사용
					if (typeof window !== 'undefined') {
						window.location.reload();
					}
				});
			}
		}
	}, [router, pathname]);

	return null;
}

