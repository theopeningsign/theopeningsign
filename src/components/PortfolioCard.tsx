// 포트폴리오 카드 컴포넌트
"use client";

import { useState, useRef, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PortfolioItem } from '@/lib/types';
import { isNotionImageUrl, isProxyImageUrl } from '@/lib/notion';

interface Props {
	item: PortfolioItem;
	priority?: boolean; // 첫 화면에 보이는 이미지에만 priority 적용
	currentPage?: number;
}

// 이미지가 실패하면 같은 프록시 URL에 캐시버스터를 붙여 "이 이미지 1장만" 조용히 재시도한다.
// 프록시가 요청 시점에 싱싱한 S3 URL을 돌려주므로, 페이지 새로고침/리렌더 없이 복구된다.
const MAX_IMG_RETRY = 2;

function PortfolioCard({ item, priority = false, currentPage = 1 }: Props) {
	const [imgLoading, setImgLoading] = useState(true);
	const [retry, setRetry] = useState(0);
	const retryRef = useRef(0);

	const baseSrc = item.coverImageUrl || '/placeholder.svg';
	// 재시도 시에만 캐시버스터 추가 (정상 로드 시 URL 안정적 → 불필요한 재요청 없음)
	const src = retry > 0 ? `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}r=${retry}` : baseSrc;

	const handleImageLoad = () => {
		setImgLoading(false);
	};

	const handleImageError = () => {
		// 이 카드 이미지만 제한적으로 조용히 재시도 (스피너 유지, 화면 흔들림 없음)
		if (retryRef.current < MAX_IMG_RETRY) {
			retryRef.current += 1;
			setRetry(retryRef.current);
		} else {
			// 더는 재시도하지 않음 — 스피너만 유지 (placeholder는 띄우지 않음)
			setImgLoading(true);
		}
	};

	// 상세 페이지로는 Notion 원본 page.id를 그대로 전달 (하이픈 포함)
	const href = item.id ? `/portfolio/${encodeURIComponent(item.id)}` : '#';

	// 클릭 시 현재 카드의 위치와 스크롤 위치 저장
	const handleClick = (e: React.MouseEvent) => {
		const cardElement = e.currentTarget;
		const rect = cardElement.getBoundingClientRect();
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const cardTop = rect.top + scrollTop;

		sessionStorage.setItem('portfolioScrollPosition', scrollTop.toString());
		sessionStorage.setItem('portfolioCardId', item.id);
		sessionStorage.setItem('portfolioCardTop', cardTop.toString());
		sessionStorage.setItem('portfolioCurrentPage', currentPage.toString());

		if (typeof window !== 'undefined') {
			sessionStorage.setItem('portfolioQueryParams', window.location.search);
		}
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
				{/* 로딩 스피너 (사진 뜰 때까지 표시, placeholder 회색박스는 사용 안 함) */}
				<div className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-100 transition-opacity duration-200 ${imgLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-orange-400" />
				</div>
				<Image
					key={src}
					src={src}
					alt={item.title}
					fill
					data-portfolio-image="true"
					className={`object-cover transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
					onError={handleImageError}
					onLoad={handleImageLoad}
					unoptimized={isProxyImageUrl(baseSrc) || isNotionImageUrl(baseSrc)}
					priority={priority}
					loading={priority ? undefined : 'lazy'}
					sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
				/>
				<div className="absolute inset-0 bg-slate-900/0 transition-colors group-hover:bg-slate-900/20" />
				<div className="absolute inset-x-0 bottom-0 translate-y-2 px-3 pb-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
					<div className="inline-block rounded bg-black/70 px-2 py-1 text-xs text-white">{item.title}</div>
				</div>
			</div>
			<div className="space-y-1 p-4">
				<h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h3>
				<div className="flex items-center gap-2 overflow-hidden">
					<p className="flex-shrink-0 text-sm text-slate-600">{item.location || '지역 정보 미상'}</p>
					{item.departments && item.departments.length > 0 && (
						<p className="min-w-0 flex-1 truncate text-xs text-slate-500">
							{item.departments.slice(0, 2).join(' · ')}
						</p>
					)}
				</div>
				<p className="text-sm text-slate-500">{item.type || '기타'} · {item.completedAt ? (() => { try { const parts = item.completedAt.split('-'); if (parts.length >= 2 && parts[0] && parts[1]) { const [y, m] = parts; return `${y}년 ${Number(m)}월`; } } catch {} return '연월 미상'; })() : '연월 미상'}</p>
			</div>
		</Link>
	);
}

// 메모이제이션으로 불필요한 재렌더링 방지
export default memo(PortfolioCard, (prevProps, nextProps) => {
	return (
		prevProps.item.id === nextProps.item.id &&
		prevProps.item.coverImageUrl === nextProps.item.coverImageUrl &&
		prevProps.priority === nextProps.priority
	);
});
