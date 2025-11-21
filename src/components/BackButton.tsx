'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isOriginalButtonVisible, setIsOriginalButtonVisible] = useState(true);
	const router = useRouter();
	const originalButtonRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		const handleScroll = () => {
			// 스크롤이 100px 이상 내려갔는지 확인
			setIsScrolled(window.scrollY > 100);
			
			// 원래 위치의 뒤로가기 버튼이 뷰포트에 보이는지 확인
			if (originalButtonRef.current) {
				const rect = originalButtonRef.current.getBoundingClientRect();
				const isVisible = rect.top >= 0 && rect.top < window.innerHeight && rect.bottom > 0;
				setIsOriginalButtonVisible(isVisible);
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // 초기 상태 확인

		// Intersection Observer로 원래 버튼의 가시성 확인
		if (originalButtonRef.current) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						setIsOriginalButtonVisible(entry.isIntersecting);
					});
				},
				{ threshold: 0.1 }
			);
			observer.observe(originalButtonRef.current);

			return () => {
				window.removeEventListener('scroll', handleScroll);
				observer.disconnect();
			};
		}

		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleBack = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation(); // 이벤트 전파 방지 (이미지 클릭 방지)
		e.nativeEvent.stopImmediatePropagation(); // 즉시 전파 중지
		// 뒤로가기 플래그 설정 (스크롤 복원을 위해)
		sessionStorage.setItem('shouldRestoreScroll', 'true');
		// 현재 스크롤 위치 저장 (상세 페이지에서)
		sessionStorage.setItem('portfolioScrollPosition', window.scrollY.toString());
		router.push('/portfolio');
	};

	return (
		<>
			{/* 원래 위치의 뒤로가기 버튼 (스크롤 전에 보이는 버튼) */}
			<Link 
				ref={originalButtonRef}
				href="/portfolio" 
				onClick={handleBack}
				className={`inline-flex items-center gap-1 text-base md:text-lg font-medium text-blue-800 hover:underline mb-3 transition-opacity duration-200 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
			>
				← 뒤로가기
			</Link>
			{/* 고정 뒤로가기 버튼 (원래 버튼이 보이지 않을 때 왼쪽에 표시) */}
			<button
				type="button"
				onClick={handleBack}
				onMouseDown={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				onTouchStart={(e) => {
					e.stopPropagation();
				}}
				className={`fixed left-4 top-20 z-[100] inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-sm px-3 py-2 text-base md:text-lg font-medium text-blue-800 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 ${!isOriginalButtonVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}
				style={{ 
					touchAction: 'manipulation',
					position: 'fixed',
					zIndex: 100
				}}
			>
				← 뒤로가기
			</button>
		</>
	);
}

