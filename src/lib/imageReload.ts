"use client";

// 상수 export
export const PORTFOLIO_LIST_ERROR_KEY = 'portfolio_list_images';
export const PORTFOLIO_LIST_RELOAD_FLAG = 'portfolio_list_reload_scheduled';
export const MAX_REFRESH_ATTEMPTS = 2;

// router를 파라미터로 받아서 refresh하는 방식으로 변경
export function scheduleImageReload(errorKey: string, router: { refresh: () => void }, delay = 3000) {
	if (typeof window === 'undefined' || !errorKey) return;

	const attempts = Number.parseInt(sessionStorage.getItem(errorKey) || '0', 10);
	if (attempts >= MAX_REFRESH_ATTEMPTS) {
		// 최대 재시도 도달 - 플래그 제거하고 종료
		if (errorKey === PORTFOLIO_LIST_ERROR_KEY) {
			sessionStorage.removeItem(PORTFOLIO_LIST_RELOAD_FLAG);
		}
		return;
	}

	sessionStorage.setItem(errorKey, String(attempts + 1));
	sessionStorage.setItem('reloadScrollPosition', window.scrollY.toString());
	sessionStorage.setItem('isRefreshing', 'true'); // refresh 중임을 표시

	setTimeout(() => {
		// 페이지 새로고침 대신 서버 컴포넌트만 다시 렌더링 (부드러운 갱신)
		router.refresh();
		
		// refresh 완료 후 플래그 제거 (약간의 지연을 두어 상태 리셋 방지)
		setTimeout(() => {
			sessionStorage.removeItem('isRefreshing');
			// refresh 완료 후에도 플래그 제거
			if (errorKey === PORTFOLIO_LIST_ERROR_KEY) {
				sessionStorage.removeItem(PORTFOLIO_LIST_RELOAD_FLAG);
			}
		}, 5000); // 2초에서 5초로 증가
	}, delay);
}

export function clearImageReloadFlag(errorKey: string) {
	if (typeof window === 'undefined' || !errorKey) return;
	sessionStorage.removeItem(errorKey);
}

export function clearImageErrorFlags() {
	if (typeof window === 'undefined') return;
	const keys = Object.keys(sessionStorage);
	keys.forEach((key) => {
		// img_error_ 로 시작하는 키와 reload 플래그도 제거
		if (key.startsWith('img_error_') || key === 'isRefreshing' || key === PORTFOLIO_LIST_RELOAD_FLAG) {
			sessionStorage.removeItem(key);
		}
	});
}
