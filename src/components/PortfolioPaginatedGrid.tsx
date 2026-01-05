"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PortfolioGrid from '@/components/PortfolioGrid';
import type { PortfolioItem } from '@/lib/types';
import { clearImageErrorFlags, PORTFOLIO_LIST_RELOAD_FLAG, PORTFOLIO_LIST_ERROR_KEY, MAX_REFRESH_ATTEMPTS } from '@/lib/imageReload';

interface Props {
	items: PortfolioItem[];
}

const getItemsPerPage = (width?: number) => {
	if (typeof width !== 'number') return 9;
	if (width < 768) return 6;
	if (width < 1280) return 6;
	return 9;
};

export default function PortfolioPaginatedGrid({ items }: Props) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [itemsPerPage, setItemsPerPage] = useState(9);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [showRetryModal, setShowRetryModal] = useState(false);
	const filterButtonRef = useRef<HTMLButtonElement>(null);
	const filterDropdownRef = useRef<HTMLDivElement>(null);
	const [filterDropdownStyle, setFilterDropdownStyle] = useState<{ top: number; left: number } | null>(null);

	// URL에서 직접 읽기
	const selectedDepartments = searchParams.get('departments')?.split(',').filter(Boolean) || [];
	const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);

	// 페이지 이동 시 세션 기반 이미지 로딩 플래그 초기화
	useEffect(() => {
		clearImageErrorFlags();
	}, [currentPage]);

	// 🔍 디버깅: bfcache 복원 시 JS 재실행 여부 확인
	useEffect(() => {
		console.log('🔄 PortfolioPaginatedGrid mounted/remounted at:', new Date().toISOString());
		
		// 🧪 개발/테스트용: 재시도 모달 테스트 함수 등록 (항상 사용 가능)
		if (typeof window !== 'undefined') {
			(window as any).testRetryModal = () => {
				console.log('🧪 Testing retry modal...');
				sessionStorage.setItem(PORTFOLIO_LIST_ERROR_KEY, '3'); // 최대 재시도 설정
				// 체크 함수를 강제로 실행
				const checkRetryStatus = () => {
					const attempts = Number.parseInt(sessionStorage.getItem(PORTFOLIO_LIST_ERROR_KEY) || '0', 10);
					if (attempts >= MAX_REFRESH_ATTEMPTS) {
						setShowRetryModal(true);
						console.log('✅ Retry modal should be visible now');
					}
				};
				checkRetryStatus();
			};
			console.log('🧪 테스트 함수 등록됨: window.testRetryModal() 실행해서 새로고침 버튼 테스트 가능');
		}
		
		const handlePageshow = (e: PageTransitionEvent) => {
			console.log('📱 Pageshow event:', {
				persisted: e.persisted,
				type: e.type,
				timestamp: new Date().toISOString(),
				url: window.location.href
			});
			
			if (e.persisted) {
				console.log('🎯 bfcache 복원됨! 이미지 강제 재검증 시작');
				sessionStorage.setItem('bfcache_detected', 'true');
				
				// 모바일 Safari 감지
				const isMobileSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
				console.log('📱 Mobile Safari detected:', isMobileSafari);
				
				if (isMobileSafari) {
					// 모바일 Safari에서는 더 빨리, 더 적극적으로 처리
					setTimeout(() => {
						console.log('🍎 Mobile Safari: Quick image check and potential force refresh');
						const notionImages = document.querySelectorAll('img[src*="notion"]');
						let hasFailedImages = false;
						
						console.log(`📸 Mobile Safari: Found ${notionImages.length} Notion images to check`);
						
						// 모바일에서는 더 엄격한 검증
						notionImages.forEach((img: Element, index: number) => {
							const imgElement = img as HTMLImageElement;
							const src = imgElement.src;
							
							// 모바일 Safari에서는 더 많은 조건으로 실패 판단
							const isImageFailed = (
								!imgElement.complete ||
								imgElement.naturalHeight === 0 ||
								imgElement.naturalWidth === 0 ||
								// Notion URL 만료 시간 추정 (X-Amz-Expires 체크)
								(src.includes('X-Amz-Expires') && src.includes('X-Amz-Date'))
							);
							
							console.log(`🖼️ Mobile Image ${index + 1}:`, {
								src: src.substring(src.length - 50),
								complete: imgElement.complete,
								naturalHeight: imgElement.naturalHeight,
								naturalWidth: imgElement.naturalWidth,
								failed: isImageFailed
							});
							
							if (isImageFailed) {
								hasFailedImages = true;
							}
						});
						
						if (hasFailedImages) {
							console.log('🚨 Mobile Safari: Failed images detected! Trying server refresh first...');
							router.refresh();
							
							// 모바일에서는 서버 refresh가 안되면 3초 후 강제 새로고침
							setTimeout(() => {
								const stillFailedImages = Array.from(document.querySelectorAll('img[src*="notion"]')).some(img => {
									const imgElement = img as HTMLImageElement;
									return !imgElement.complete || imgElement.naturalHeight === 0;
								});
								
								if (stillFailedImages) {
									console.log('💀 Mobile Safari: Server refresh insufficient, forcing page reload');
									window.location.reload();
								} else {
									console.log('✅ Mobile Safari: Server refresh successful!');
								}
							}, 3000);
						} else {
							console.log('✅ Mobile Safari: All images loading fine');
						}
						
						// bfcache 플래그 제거
						sessionStorage.removeItem('bfcache_detected');
					}, 500); // 모바일은 더 빠르게 (500ms)
				} else {
					// 데스크톱은 기존 로직 유지 (더 정교한 처리)
					setTimeout(() => {
						console.log('🖥️ Desktop: Checking all Notion images for validity...');
						const notionImages = document.querySelectorAll('img[src*="notion"]');
						let hasFailedImages = false;
						
						console.log(`📸 Desktop: Found ${notionImages.length} Notion images to check`);
						
						notionImages.forEach((img: Element, index: number) => {
							const imgElement = img as HTMLImageElement;
							const src = imgElement.src;
							
							// 데스크톱은 기존 로직 유지
							const isImageFailed = !imgElement.complete || imgElement.naturalHeight === 0;
							
							console.log(`🖼️ Desktop Image ${index + 1}:`, {
								src: src.substring(src.length - 50),
								complete: imgElement.complete,
								naturalHeight: imgElement.naturalHeight,
								failed: isImageFailed
							});
							
							if (isImageFailed) {
								hasFailedImages = true;
							}
						});
						
						if (hasFailedImages) {
							console.log('🚨 Desktop: Failed images detected! Triggering server refresh...');
							router.refresh();
						} else {
							console.log('✅ Desktop: All images are loading fine');
						}
						
						// bfcache 플래그 제거
						sessionStorage.removeItem('bfcache_detected');
					}, 1000); // 데스크톱은 기존 1초 유지
				}
			}
		};
		
		const handleVisibilityChange = () => {
			console.log('👁️ Visibility change:', {
				state: document.visibilityState,
				timestamp: new Date().toISOString(),
				url: window.location.href
			});
		};
		
		window.addEventListener('pageshow', handlePageshow);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		return () => {
			window.removeEventListener('pageshow', handlePageshow);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	// 최대 재시도 도달 여부 확인 및 모달 표시
	useEffect(() => {
		if (typeof window === 'undefined') return;
		
		const checkRetryStatus = () => {
			const attempts = Number.parseInt(sessionStorage.getItem(PORTFOLIO_LIST_ERROR_KEY) || '0', 10);
			if (attempts >= MAX_REFRESH_ATTEMPTS) {
				setShowRetryModal(true);
			}
		};

		// 초기 확인
		checkRetryStatus();

		// 주기적으로 확인 (재시도가 진행 중일 수 있으므로)
		const interval = setInterval(checkRetryStatus, 500);
		
		return () => clearInterval(interval);
	}, []);


	// 화면 크기에 따라 페이지당 아이템 수 결정
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const updateItemsPerPage = () => {
			const next = getItemsPerPage(window.innerWidth);
			setItemsPerPage((prev) => (prev === next ? prev : next));
		};
		updateItemsPerPage();
		window.addEventListener('resize', updateItemsPerPage);
		return () => window.removeEventListener('resize', updateItemsPerPage);
	}, []);

	// 드롭다운 외부 클릭 시 닫기
	useEffect(() => {
		if (!isFilterOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				filterButtonRef.current &&
				filterDropdownRef.current &&
				!filterButtonRef.current.contains(target) &&
				!filterDropdownRef.current.contains(target)
			) {
				setIsFilterOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isFilterOpen]);

	// 사용 가능한 진료과목 목록 추출
	const availableDepartments = useMemo(() => {
		const deptSet = new Set<string>();
		items.forEach(item => {
			item.departments?.forEach(dept => deptSet.add(dept));
		});
		return Array.from(deptSet).sort();
	}, [items]);

	// 필터링 (진료과목만, OR 조건)
	const filteredItems = useMemo(() => {
		if (selectedDepartments.length === 0) return items;
		
		return items.filter(item => {
			// OR 조건: 선택한 진료과목 중 하나라도 있으면 표시
			return selectedDepartments.some(dept => 
				item.departments?.includes(dept)
			);
		});
	}, [items, selectedDepartments]);

	const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

	// URL 업데이트 함수 (함수 내부에서 searchParams 직접 읽기)
	const updateURL = (updates: {
		departments?: string[];
		page?: number;
	}) => {
		const params = new URLSearchParams();
		
		// 현재 URL에서 직접 읽기 (클로저 문제 해결)
		const currentDepartments = searchParams.get('departments')?.split(',').filter(Boolean) || [];
		const currentPageNum = Number.parseInt(searchParams.get('page') || '1', 10);
		
		const finalDepartments = updates.departments !== undefined 
			? updates.departments 
			: currentDepartments;
		const finalPage = updates.page !== undefined ? updates.page : currentPageNum;
		
		if (finalDepartments.length > 0) {
			params.set('departments', finalDepartments.join(','));
		}
		if (finalPage > 1) {
			params.set('page', finalPage.toString());
		}
		
		router.replace(params.toString() ? `?${params.toString()}` : '?', { scroll: false });
	};

	// 현재 페이지가 총 페이지 수를 넘으면 보정
	useEffect(() => {
		// refresh 중이면 페이지 보정 완전히 스킵
		const isRefreshing = typeof window !== 'undefined' && sessionStorage.getItem('isRefreshing') === 'true';
		if (isRefreshing) return;
		
		// refresh가 끝난 후에도 계산이 안정화될 때까지 대기
		const timer = setTimeout(() => {
			if (currentPage > totalPages && totalPages > 0) {
				// 가능한 범위 내 최대 페이지로 이동
				updateURL({ page: totalPages });
			}
		}, 200); // 충분한 시간을 두어 계산이 안정화되도록
		
		return () => clearTimeout(timer);
	}, [totalPages, currentPage]);

	// 진료과목 토글
	const handleDepartmentToggle = (dept: string) => {
		const newDepartments = selectedDepartments.includes(dept)
			? selectedDepartments.filter(d => d !== dept)
			: [...selectedDepartments, dept];
		
		// 필터 변경 시 재시도 플래그 초기화
		sessionStorage.removeItem(PORTFOLIO_LIST_RELOAD_FLAG);
		
		updateURL({ departments: newDepartments, page: 1 });
	};

	// 초기화
	const handleReset = () => {
		// 필터 리셋 시 플래그도 초기화
		sessionStorage.removeItem(PORTFOLIO_LIST_RELOAD_FLAG);
		
		updateURL({ departments: [], page: 1 });
		setIsFilterOpen(false);
	};

	// 페이지 변경
	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages || page === currentPage) return;
		
		// 페이지 변경 시 재시도 플래그 초기화 (새 페이지에서는 다시 재시도 가능)
		sessionStorage.removeItem(PORTFOLIO_LIST_RELOAD_FLAG);
		
		updateURL({ page });
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const currentItems = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredItems.slice(start, start + itemsPerPage);
	}, [filteredItems, currentPage, itemsPerPage]);

	const pageNumbers = useMemo(() => {
		const maxButtons = 5;
		const pages: number[] = [];
		let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
		let end = Math.min(totalPages, start + maxButtons - 1);
		start = Math.max(1, end - maxButtons + 1);

		for (let i = start; i <= end; i += 1) {
			pages.push(i);
		}
		return pages;
	}, [currentPage, totalPages]);

	return (
		<div className="space-y-8">
			{/* 필터 UI */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex items-center gap-2">
					<button
						ref={filterButtonRef}
						type="button"
						onClick={() => {
							if (filterButtonRef.current) {
								const rect = filterButtonRef.current.getBoundingClientRect();
								setFilterDropdownStyle({
									top: rect.bottom + window.scrollY + 8,
									left: rect.left + window.scrollX,
								});
							}
							setIsFilterOpen(!isFilterOpen);
						}}
						className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						진료과목 필터
						{selectedDepartments.length > 0 && (
							<span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
								{selectedDepartments.length}
							</span>
						)}
						<svg
							className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{selectedDepartments.length > 0 && (
						<button
							type="button"
							onClick={handleReset}
							className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
						>
							초기화
						</button>
					)}

					{isFilterOpen && filterDropdownStyle && (
						<div 
							ref={filterDropdownRef}
							className="fixed z-50 w-64 rounded-lg border border-slate-200 bg-white shadow-lg sm:w-auto sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] xl:min-w-[700px] 2xl:min-w-[800px]"
							style={{
								top: `${filterDropdownStyle.top}px`,
								left: `${filterDropdownStyle.left}px`,
							}}
						>
							<div className="max-h-64 overflow-y-auto p-2">
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
									{availableDepartments.map((dept) => (
										<label
											key={dept}
											className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-50 cursor-pointer min-w-0"
										>
											<input
												type="checkbox"
												checked={selectedDepartments.includes(dept)}
												onChange={() => handleDepartmentToggle(dept)}
												className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
											/>
											<span className="text-sm text-slate-700 whitespace-nowrap truncate" title={dept}>{dept}</span>
										</label>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 선택된 필터 표시 */}
			{selectedDepartments.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedDepartments.map((dept) => (
						<span
							key={dept}
							className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800"
						>
							{dept}
							<button
								type="button"
								onClick={() => handleDepartmentToggle(dept)}
								className="hover:text-orange-900"
							>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</span>
					))}
				</div>
			)}

			{/* 결과 개수 표시 */}
			<p className="text-sm text-slate-600">
				총 {filteredItems.length}개의 포트폴리오
			</p>

			{/* 포트폴리오 그리드 */}
			<PortfolioGrid
				items={currentItems}
				priorityCount={Math.min(itemsPerPage, 12)}
				currentPage={currentPage}
			/>

			{/* 페이지네이션 */}
			{totalPages > 1 && (
				<div className="flex flex-col items-center gap-2">
					<div className="flex items-center gap-1">
						{/* 이전 페이지 버튼 */}
						<button
							type="button"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							이전
						</button>

						{/* 페이지 번호 */}
						{pageNumbers.map((page) => (
							<button
								key={page}
								type="button"
								onClick={() => handlePageChange(page)}
								className={`rounded-lg border px-3 py-2 text-sm font-medium ${
									page === currentPage
										? 'border-orange-500 bg-orange-500 text-white'
										: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
								}`}
							>
								{page}
							</button>
						))}

						{/* 다음 페이지 버튼 */}
						<button
							type="button"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							다음
						</button>
					</div>

					<p className="text-sm text-slate-600">
						{currentPage} / {totalPages} 페이지
					</p>
				</div>
			)}

			{/* 최대 재시도 도달 시 모달 */}
			{showRetryModal && (
				<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRetryModal(false)}>
					<div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
						<h3 className="mb-4 text-lg font-semibold text-slate-900">URL 갱신 필요</h3>
						<p className="mb-6 text-sm text-slate-600">
							이미지 로드를 위해 새로고침 해주세요
						</p>
						<button
							onClick={() => {
								window.location.reload();
							}}
							className="w-full rounded-lg bg-orange-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500"
						>
							새로고침
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
