// 상담 참고용 "담은 포트폴리오" 목록 — 회원가입 없이 브라우저(localStorage)에 저장.
// 컴포넌트 간 동기화를 위해 변경 시 커스텀 이벤트(WISHLIST_EVENT)를 발생시킨다.

export type WishItem = { id: string; title: string };

export const WISHLIST_KEY = 'portfolio_wishlist';
export const WISHLIST_EVENT = 'wishlist-change';

export function getWishlist(): WishItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(WISHLIST_KEY);
		return raw ? (JSON.parse(raw) as WishItem[]) : [];
	} catch {
		return [];
	}
}

function save(list: WishItem[]) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
	} catch {
		/* noop */
	}
	window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function isInWishlist(id: string): boolean {
	return getWishlist().some((w) => w.id === id);
}

// 담기/빼기 토글. 담으면 true, 빼면 false 반환
export function toggleWishlist(item: WishItem): boolean {
	const list = getWishlist();
	const exists = list.some((w) => w.id === item.id);
	save(exists ? list.filter((w) => w.id !== item.id) : [...list, item]);
	return !exists;
}

export function removeWishlist(id: string) {
	save(getWishlist().filter((w) => w.id !== id));
}

export function clearWishlist() {
	save([]);
}
