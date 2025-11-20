// 포트폴리오 카드 컴포넌트
"use client";

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PortfolioItem } from '@/lib/types';
import { isNotionImageUrl } from '@/lib/notion';

interface Props {
	item: PortfolioItem;
	priority?: boolean; // 첫 화면에 보이는 이미지에만 priority 적용
}

function PortfolioCard({ item, priority = false }: Props) {
	const [imgError, setImgError] = useState(false);
	const [imgLoading, setImgLoading] = useState(true);

	const handleImageError = () => {
		// 이미지 로드 실패 시 바로 placeholder로 전환
		setImgError(true);
		setImgLoading(false);
	};

	const handleImageLoad = () => {
		setImgLoading(false);
		setImgError(false);
	};

	// 이미지 URL이 변경되면 상태 리셋
	useEffect(() => {
		setImgError(false);
		setImgLoading(true);
	}, [item.coverImageUrl]);

	// 상세 페이지로는 Notion 원본 page.id를 그대로 전달 (하이픈 포함)
	const href = item.id ? `/portfolio/${encodeURIComponent(item.id)}` : '#';
	return (
		<Link
			href={href}
			className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
			style={{ borderColor: '#FAD2BE' }}
		>
			<div className="relative aspect-[4/3] w-full">
				{imgLoading && (
					<div className="absolute inset-0 z-10 animate-pulse bg-slate-200" />
				)}
				<Image
					src={imgError ? '/placeholder.svg' : (item.coverImageUrl || '/placeholder.svg')}
					alt={item.title}
					fill
					className={`object-cover transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
					placeholder="blur"
					blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="
					onError={handleImageError}
					onLoad={handleImageLoad}
					unoptimized={imgError || (item.coverImageUrl ? isNotionImageUrl(item.coverImageUrl) : false)} // Notion 이미지만 최적화 비활성화 (Vercel Cache Writes 초과 방지)
					priority={priority} // 첫 화면에 보이는 이미지만 priority
					loading={priority ? undefined : 'lazy'} // priority가 아닌 경우 lazy loading
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
		prevProps.priority === nextProps.priority
	);
});

