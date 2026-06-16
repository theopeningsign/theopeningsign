'use client';

// 상단 네비게이션 헤더
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
	const pathname = usePathname();
	// 홈에서는 풀스크린 사진 위에 얹히므로 투명 헤더 + 흰색 텍스트/로고.
	// 다른 페이지는 배경이 흰색이라 기존 프로스트 헤더 + 주황 텍스트 유지.
	const isHome = pathname === '/';

	const handleNavClick = () => {
		window.scrollTo({ top: 0, behavior: 'instant' });
		setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
		setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 50);
		setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 100);
	};

	const linkClass = `text-sm md:text-base transition-colors ${
		isHome
			? 'text-white hover:text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]'
			: 'text-[#ED6A26] hover:text-[#FF8C3C]'
	}`;

	return (
		<header
			className={`sticky top-0 z-40 w-full transition-colors ${
				isHome
					? 'bg-transparent'
					: 'border-b border-slate-200/60 bg-white/70 backdrop-blur-md'
			}`}
		>
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
				<Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-800">
					<span className="sr-only">THE OPENING SIGN</span>
					<Image
						src="/logo.png"
						alt="THE OPENING SIGN"
						width={200}
						height={40}
						className={`h-8 w-auto md:h-10 ${
							isHome ? '[filter:brightness(0)_invert(1)_drop-shadow(0_1px_4px_rgba(0,0,0,0.4))]' : ''
						}`}
					/>
				</Link>
				<nav className="flex items-center gap-3 md:gap-6">
					<Link href="/" onClick={handleNavClick} className={linkClass}>Home</Link>
					<Link href="/portfolio" onClick={handleNavClick} className={linkClass}>Portfolio</Link>
					<Link href="/about" onClick={handleNavClick} className={linkClass}>About us</Link>
					<Link href="/contact" onClick={handleNavClick} className={linkClass}>상담신청</Link>
				</nav>
			</div>
		</header>
	);
}
