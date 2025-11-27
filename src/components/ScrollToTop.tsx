'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
	const pathname = usePathname();

	useEffect(() => {
		// 포트폴리오 상세 페이지에 진입할 때 스크롤을 맨 위로
		if (pathname?.startsWith('/portfolio/') && pathname !== '/portfolio') {
			// 즉시 스크롤을 맨 위로
			window.scrollTo({ top: 0, behavior: 'instant' });
			
			// DOM이 완전히 로드된 후에도 한 번 더 확인
			const timer = setTimeout(() => {
				window.scrollTo({ top: 0, behavior: 'instant' });
			}, 0);

			return () => clearTimeout(timer);
		}
	}, [pathname]);

	return null;
}








