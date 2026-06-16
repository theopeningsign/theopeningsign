'use client';

import { useEffect } from 'react';

// 페이지 진입 시 항상 최상단에서 시작하도록 강제.
// (긴 상세페이지 등에서 넘어올 때 스크롤 위치가 따라오는 것 방지)
export default function ScrollTopOnMount() {
	useEffect(() => {
		window.scrollTo(0, 0);
		requestAnimationFrame(() => window.scrollTo(0, 0));
	}, []);
	return null;
}
