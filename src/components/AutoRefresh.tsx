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
				// requestAnimationFrame으로 다음 프레임에서 실행하여 DOM이 준비된 후 새로고침
				requestAnimationFrame(() => {
					sessionStorage.setItem(refreshKey, 'true');
					router.refresh();
				});
			}
		}
	}, [router, pathname]);

	return null;
}

