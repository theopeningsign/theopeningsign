'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollRestoration() {
	const pathname = usePathname();
	const hasRestored = useRef(false);

	useEffect(() => {
		// 포트폴리오 상세 페이지에서 reloadScrollPosition 복원 (이미지 로드 실패로 인한 새로고침)
		if (pathname?.startsWith('/portfolio/') && pathname !== '/portfolio') {
			const reloadScrollPosition = sessionStorage.getItem('reloadScrollPosition');
			if (reloadScrollPosition) {
				const targetPosition = parseInt(reloadScrollPosition, 10);
				// 여러 번 시도하여 이미지 로드 후 레이아웃 변경에 대응
				const attemptRestore = () => {
					window.scrollTo({
						top: targetPosition,
						behavior: 'instant' as ScrollBehavior
					});
				};
				
				// 즉시 복원 시도
				attemptRestore();
				requestAnimationFrame(() => {
					attemptRestore();
					setTimeout(() => {
						attemptRestore();
						// 복원 후 세션 스토리지 정리
						sessionStorage.removeItem('reloadScrollPosition');
					}, 500);
				});
			}
		}
		
		// 포트폴리오 목록 페이지에서만 스크롤 위치 저장/복원
		if (pathname === '/portfolio') {
			// 스크롤 복원 함수 (여러 곳에서 사용)
			const tryRestore = () => {
				const savedCardId = sessionStorage.getItem('portfolioCardId');
				const savedCardTop = sessionStorage.getItem('portfolioCardTop');
				const savedScrollPosition = sessionStorage.getItem('portfolioScrollPosition');
				
				// 카드 ID로 복원 시도
				if (savedCardId) {
					const cardElement = document.querySelector(`[data-portfolio-id="${savedCardId}"]`);
					if (cardElement) {
						const rect = cardElement.getBoundingClientRect();
						const scrollTop = window.scrollY || document.documentElement.scrollTop;
						const cardTop = rect.top + scrollTop;
						const headerOffset = 80;
						const targetPosition = Math.max(0, cardTop - headerOffset);
						
						window.scrollTo({
							top: targetPosition,
							behavior: 'instant' as ScrollBehavior
						});
						return; // 성공했으면 더 이상 시도하지 않음
					}
				}
				
				// 카드를 찾지 못했으면 저장된 스크롤 위치로 복원
				if (savedScrollPosition) {
					const targetPosition = parseInt(savedScrollPosition, 10);
					const currentHeight = document.documentElement.scrollHeight;
					const viewportHeight = window.innerHeight;
					const maxScroll = Math.max(0, currentHeight - viewportHeight);
					const finalPosition = Math.min(targetPosition, maxScroll);
					
					window.scrollTo({
						top: finalPosition,
						behavior: 'instant' as ScrollBehavior
					});
				}
			};

			// 저장된 위치가 있고 아직 복원하지 않았으면 복원 시도
			// 단, 뒤로가기로 들어온 경우에만 복원 (shouldRestoreScroll 플래그 확인)
			const shouldRestore = sessionStorage.getItem('shouldRestoreScroll') === 'true';
			const savedCardId = sessionStorage.getItem('portfolioCardId');
			const savedScrollPosition = sessionStorage.getItem('portfolioScrollPosition');
			
			if (shouldRestore && (savedCardId || savedScrollPosition) && !hasRestored.current) {
				hasRestored.current = true;

				// 여러 번 시도
				const attemptRestore = () => {
					tryRestore();
					requestAnimationFrame(() => {
						tryRestore();
						setTimeout(() => {
							tryRestore();
							setTimeout(() => {
								tryRestore();
								// 최종 복원 후 세션 스토리지 정리
								setTimeout(() => {
									sessionStorage.removeItem('portfolioCardId');
									sessionStorage.removeItem('portfolioCardTop');
									sessionStorage.removeItem('portfolioScrollPosition');
									sessionStorage.removeItem('shouldRestoreScroll'); // 플래그도 제거
								}, 100);
							}, 500);
						}, 200);
					});
				};

				// DOM이 준비된 후 시도
				if (document.readyState === 'complete') {
					setTimeout(attemptRestore, 0);
				} else {
					window.addEventListener('load', attemptRestore, { once: true });
					setTimeout(attemptRestore, 0);
				}
			}

			// 모바일 브라우저의 bfcache(뒤로가기 캐시) 대응
			const handlePageshow = (e: PageTransitionEvent) => {
				if (e.persisted) {
					// 뒤로가기로 들어온 경우에만 복원
					const shouldRestore = sessionStorage.getItem('shouldRestoreScroll') === 'true';
					if (shouldRestore) {
						hasRestored.current = false;
						const savedCardId = sessionStorage.getItem('portfolioCardId');
						const savedScrollPosition = sessionStorage.getItem('portfolioScrollPosition');
						
						if (savedCardId || savedScrollPosition) {
							setTimeout(() => {
								tryRestore();
								setTimeout(() => tryRestore(), 100);
								setTimeout(() => tryRestore(), 300);
							}, 50);
						}
					}
				}
			};

			window.addEventListener('pageshow', handlePageshow);

			// 스크롤 이벤트로 주기적으로 저장 (쓰로틀링 + 디바운싱)
			let scrollTimeout: NodeJS.Timeout;
			let lastScrollTime = 0;
			const throttleDelay = 500; // 500ms마다 최대 1번만 저장
			
			const handleScroll = () => {
				const now = Date.now();
				
				// 쓰로틀링: 최소 간격 내에는 실행하지 않음
				if (now - lastScrollTime < throttleDelay) {
					clearTimeout(scrollTimeout);
					scrollTimeout = setTimeout(() => {
						sessionStorage.setItem('portfolioScrollPosition', window.scrollY.toString());
						lastScrollTime = Date.now();
					}, throttleDelay);
					return;
				}
				
				lastScrollTime = now;
				sessionStorage.setItem('portfolioScrollPosition', window.scrollY.toString());
			};

			// requestAnimationFrame으로 부드러운 스크롤 처리
			let rafId: number | null = null;
			const onScroll = () => {
				if (rafId === null) {
					rafId = requestAnimationFrame(() => {
						handleScroll();
						rafId = null;
					});
				}
			};

			window.addEventListener('scroll', onScroll, { passive: true });

			return () => {
				window.removeEventListener('scroll', onScroll);
				window.removeEventListener('pageshow', handlePageshow);
				clearTimeout(scrollTimeout);
				if (rafId !== null) {
					cancelAnimationFrame(rafId);
				}
			};
		} else {
			// 다른 페이지로 이동하면 복원 플래그 리셋
			hasRestored.current = false;
		}
	}, [pathname]);

	return null;
}

