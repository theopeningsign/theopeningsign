"use client";

// router를 파라미터로 받아서 refresh하는 방식으로 변경
export function scheduleImageReload(errorKey: string, router: { refresh: () => void }, delay = 3000) {
	if (typeof window === 'undefined' || !errorKey) return;

	const hasReloaded = sessionStorage.getItem(errorKey);
	if (hasReloaded) return;

	sessionStorage.setItem(errorKey, 'true');
	sessionStorage.setItem('reloadScrollPosition', window.scrollY.toString());
	sessionStorage.setItem('isRefreshing', 'true'); // refresh 중임을 표시

	setTimeout(() => {
		// 페이지 새로고침 대신 서버 컴포넌트만 다시 렌더링 (부드러운 갱신)
		router.refresh();
		
		// refresh 완료 후 플래그 제거 (약간의 지연을 두어 상태 리셋 방지)
		setTimeout(() => {
			sessionStorage.removeItem('isRefreshing');
		}, 2000); // 2초로 늘려서 상태 리셋 방지
	}, delay);
}

export function clearImageReloadFlag(errorKey: string) {
	if (typeof window === 'undefined' || !errorKey) return;
	sessionStorage.removeItem(errorKey);
}


