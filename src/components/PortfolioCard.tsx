// 포트폴리오 카드 컴포넌트
"use client";

import { useState, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PortfolioItem } from '@/lib/types';
import { isNotionImageUrl } from '@/lib/notion';

interface Props {
	item: PortfolioItem;
	priority?: boolean; // 첫 화면에 보이는 이미지에만 priority 적용
	onPriorityLoad?: () => void; // priority 이미지 로드 완료 시 호출
	showPriorityImages?: boolean; // priority 이미지들을 보여줄지 여부
}

function PortfolioCard({ item, priority = false, onPriorityLoad, showPriorityImages = true }: Props) {
	const [imgError, setImgError] = useState(false);
	const [imgLoading, setImgLoading] = useState(true);
	const hasLoadedRef = useRef(false); // 이미지가 한 번 로드되었는지 추적
	const forceShowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const hasNotifiedRef = useRef(false); // priority 이미지 로드 완료 알림 여부

	const handleImageError = () => {
		// 이미지 로드 실패 시에도 스피너를 계속 보여줌 (사용자는 로딩 중인 것으로 인식)
		if (forceShowTimeoutRef.current) {
			clearTimeout(forceShowTimeoutRef.current);
			forceShowTimeoutRef.current = null;
		}
		setImgError(true);
		setImgLoading(true); // 스피너 계속 표시
		// hasLoadedRef는 true로 설정하지 않아서 재시도 가능하게 함
		
		// priority 이미지 알림은 이미지가 실제로 로드될 때만 수행
	};

	const handleImageLoad = () => {
		// 이미지가 한 번 로드되면 영구적으로 로딩 완료 상태 유지
		if (!hasLoadedRef.current) {
			if (forceShowTimeoutRef.current) {
				clearTimeout(forceShowTimeoutRef.current);
				forceShowTimeoutRef.current = null;
			}
			setImgLoading(false);
			setImgError(false);
			hasLoadedRef.current = true;
			
			// priority 이미지이고 아직 알림하지 않았다면 부모에게 알림
			if (priority && onPriorityLoad && !hasNotifiedRef.current) {
				hasNotifiedRef.current = true;
				onPriorityLoad();
			}
		}
	};

	// 이미지 URL이 변경되면 상태 리셋
	const prevUrlRef = useRef<string | undefined>(item.coverImageUrl);
	useEffect(() => {
		// URL이 실제로 변경된 경우에만 리셋
		if (prevUrlRef.current !== item.coverImageUrl) {
			prevUrlRef.current = item.coverImageUrl;
			if (forceShowTimeoutRef.current) {
				clearTimeout(forceShowTimeoutRef.current);
				forceShowTimeoutRef.current = null;
			}
			setImgError(false);
			setImgLoading(true);
			hasLoadedRef.current = false;
		}
	}, [item.coverImageUrl]);

	// 브라우저 캐시에 이미지가 있는지 확인 (뒤로가기 등으로 돌아왔을 때 대응)
	useEffect(() => {
		if (item.coverImageUrl && !hasLoadedRef.current && typeof window !== 'undefined') {
			const img = document.createElement('img');
			img.onload = () => {
				// 이미지가 캐시에 있으면 즉시 로드 완료 처리
				if (!hasLoadedRef.current) {
					setImgLoading(false);
					setImgError(false);
					hasLoadedRef.current = true;
					
					// priority 이미지 로드 완료 알림
					if (priority && onPriorityLoad && !hasNotifiedRef.current) {
						hasNotifiedRef.current = true;
						onPriorityLoad();
					}
				}
			};
			img.onerror = () => {
				// 캐시에 없으면 로딩 상태 유지 (실제 Image 컴포넌트가 로드 시도)
			};
			img.src = item.coverImageUrl;
			
			return () => {
				img.onload = null;
				img.onerror = null;
			};
		}
	}, [item.coverImageUrl, priority, onPriorityLoad]);

	// showPriorityImages가 true로 변경될 때 이미지가 이미 로드되어 있으면 깜빡임 방지
	useEffect(() => {
		if (priority && showPriorityImages && hasLoadedRef.current && !imgLoading) {
			// 이미지가 이미 로드되어 있고 showPriorityImages가 true로 변경되면
			// opacity 전환을 즉시 완료하여 깜빡임 방지
			// (이미 className에 opacity-100이 적용되므로 추가 작업 불필요)
		}
	}, [priority, showPriorityImages, imgLoading]);

	// 타임아웃 제거: 에러가 나도 스피너를 계속 보여주기 위해 강제 표시하지 않음

	// 상세 페이지로는 Notion 원본 page.id를 그대로 전달 (하이픈 포함)
	const href = item.id ? `/portfolio/${encodeURIComponent(item.id)}` : '#';
	
	// 클릭 시 현재 카드의 위치와 스크롤 위치 저장
	const handleClick = (e: React.MouseEvent) => {
		const cardElement = e.currentTarget;
		const rect = cardElement.getBoundingClientRect();
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const cardTop = rect.top + scrollTop;
		
		// 카드의 상단 위치와 현재 스크롤 위치 모두 저장
		sessionStorage.setItem('portfolioScrollPosition', scrollTop.toString());
		sessionStorage.setItem('portfolioCardId', item.id);
		sessionStorage.setItem('portfolioCardTop', cardTop.toString());
	};

	return (
		<Link
			href={href}
			onClick={handleClick}
			data-portfolio-id={item.id}
			className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
			style={{ borderColor: '#FAD2BE' }}
		>
			<div className="relative aspect-[4/3] w-full">
				<div className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-100 transition-opacity duration-300 ${(imgLoading && !hasLoadedRef.current) || (priority && !showPriorityImages) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-orange-400" />
				</div>
				<Image
					src={item.coverImageUrl || '/placeholder.svg'}
					alt={item.title}
					fill
					className={`object-cover transition-opacity duration-300 ${imgLoading || (priority && !showPriorityImages) ? 'opacity-0' : 'opacity-100'}`}
					placeholder="blur"
					blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="
					onError={handleImageError}
					onLoad={handleImageLoad}
					unoptimized={item.coverImageUrl ? isNotionImageUrl(item.coverImageUrl) : false} // Notion 이미지만 최적화 비활성화 (Vercel Cache Writes 초과 방지)
					priority={priority} // 첫 화면에 보이는 이미지만 priority
					loading={priority ? undefined : 'lazy'} // priority가 아닌 경우 lazy loading
					sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" // 반응형 이미지 크기 힌트
				/>
				<div className="absolute inset-0 bg-slate-900/0 transition-colors group-hover:bg-slate-900/20" />
				<div className="absolute inset-x-0 bottom-0 translate-y-2 px-3 pb-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
					<div className="inline-block rounded bg-black/70 px-2 py-1 text-xs text-white">{item.title}</div>
				</div>
			</div>
			<div className="space-y-1 p-4">
				<h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h3>
				<p className="line-clamp-1 text-sm text-slate-600">{item.location || '지역 정보 미상'}</p>
				<p className="text-sm text-slate-500">{item.type || '기타'} · {item.completedAt ? (() => { const [y, m] = item.completedAt.split('-'); return `${y}년 ${Number(m)}월`; })() : '연월 미상'}</p>
			</div>
		</Link>
	);
}

// 메모이제이션으로 불필요한 재렌더링 방지
export default memo(PortfolioCard, (prevProps, nextProps) => {
	// item의 id와 coverImageUrl이 같으면 재렌더링하지 않음
	return (
		prevProps.item.id === nextProps.item.id &&
		prevProps.item.coverImageUrl === nextProps.item.coverImageUrl &&
		prevProps.priority === nextProps.priority &&
		prevProps.showPriorityImages === nextProps.showPriorityImages
	);
});

