"use client";

export function scheduleImageReload(errorKey: string, delay = 200) {
	if (typeof window === 'undefined' || !errorKey) return;

	const hasReloaded = sessionStorage.getItem(errorKey);
	if (hasReloaded) return;

	sessionStorage.setItem(errorKey, 'true');
	sessionStorage.setItem('reloadScrollPosition', window.scrollY.toString());

	setTimeout(() => {
		window.location.reload();
	}, delay);
}

export function clearImageReloadFlag(errorKey: string) {
	if (typeof window === 'undefined' || !errorKey) return;
	sessionStorage.removeItem(errorKey);
}


