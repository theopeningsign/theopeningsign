'use client';

// 하단 푸터
import { usePathname } from 'next/navigation';

export default function Footer() {
	const pathname = usePathname();
	// 홈에서는 풀스크린 사진 위로 끌어올려 겹쳐서 투명 + 흰색 글자 (헤더와 동일한 처리).
	// 다른 페이지는 기존 크림색 띠 + 주황 글자 유지.
	const isHome = pathname === '/';

	if (isHome) {
		return (
			<footer className="relative z-20 -mt-24 border-0 bg-transparent">
				<div className="mx-auto max-w-6xl px-4 py-8 text-sm">
					<p className="text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
						© {new Date().getFullYear()} THE OPENING SIGN. All rights reserved.
					</p>
				</div>
			</footer>
		);
	}

	return (
		<footer className="border-t border-slate-200/60" style={{ backgroundColor: '#FFF9F5' }}>
			<div className="mx-auto max-w-6xl px-4 py-8 text-sm" style={{ color: '#C24F1E' }}>
				<p>© {new Date().getFullYear()} THE OPENING SIGN. All rights reserved.</p>
			</div>
		</footer>
	);
}
