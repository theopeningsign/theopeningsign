// 포트폴리오 카드 컴포넌트
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PortfolioItem } from '@/lib/types';

interface Props {
	item: PortfolioItem;
}

export default function PortfolioCard({ item }: Props) {
	const [imgError, setImgError] = useState(false);
	const [imgKey, setImgKey] = useState(0);

	const handleImageError = () => {
		if (imgKey === 0) {
			// 첫 번째 실패 시 한 번만 재시도
			setTimeout(() => {
				window.location.reload();
			}, 500);
			setImgKey(1);
		} else {
			// 재시도 후에도 실패하면 에러 상태로 설정
			setImgError(true);
		}
	};

	// 상세 페이지로는 Notion 원본 page.id를 그대로 전달 (하이픈 포함)
	const href = item.id ? `/portfolio/${encodeURIComponent(item.id)}` : '#';
	return (
		<Link
			href={href}
			className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
			style={{ borderColor: '#FAD2BE' }}
		>
			<div className="relative aspect-[4/3] w-full">
				{imgError ? (
					<div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
						이미지 로딩 실패
					</div>
				) : (
					<Image
						key={imgKey}
						src={item.coverImageUrl || '/placeholder.svg'}
						alt={item.title}
						fill
						className="object-cover"
						placeholder="blur"
						blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="
						onError={handleImageError}
					/>
				)}
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

