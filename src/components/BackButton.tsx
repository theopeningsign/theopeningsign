'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BackButton() {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			// 스크롤이 100px 이상 내려갔는지 확인
			setIsScrolled(window.scrollY > 100);
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 초기 상태 확인

		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<>
			{/* 원래 위치의 뒤로가기 버튼 (스크롤 전에 보이는 버튼) */}
			<Link 
				href="/portfolio" 
				className={`inline-flex items-center gap-1 text-base md:text-lg font-medium text-blue-800 hover:underline mb-3 transition-opacity duration-200 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
			>
				← 뒤로가기
			</Link>
			{/* 고정 뒤로가기 버튼 (스크롤 시 왼쪽에 표시) */}
			<Link 
				href="/portfolio" 
				className={`fixed left-4 top-20 z-10 inline-flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-sm px-3 py-2 text-base md:text-lg font-medium text-blue-800 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}
			>
				← 뒤로가기
			</Link>
		</>
	);
}

