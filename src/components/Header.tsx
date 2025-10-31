// 상단 네비게이션 헤더
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
	return (
		<header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
				<Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-800">
					<span className="sr-only">THE OPENING SIGN</span>
					<Image src="/logo.png" alt="THE OPENING SIGN" width={200} height={40} className="h-8 w-auto md:h-10" />
				</Link>
				<nav className="flex items-center gap-3 md:gap-6">
					<Link href="/" className="text-sm md:text-base transition-colors text-[#ED6A26] hover:text-[#FF8C3C]">Home</Link>
					<Link href="/portfolio" className="text-sm md:text-base transition-colors text-[#ED6A26] hover:text-[#FF8C3C]">Portfolio</Link>
					<Link href="/about" className="text-sm md:text-base transition-colors text-[#ED6A26] hover:text-[#FF8C3C]">About us</Link>
				</nav>
			</div>
		</header>
	);
}

