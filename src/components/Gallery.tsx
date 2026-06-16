"use client";

import Image from 'next/image';
import { useState, useRef, memo } from 'react';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl, isProxyImageUrl } from '@/lib/notion';

interface Props {
	images: string[]; // 보조 이미지들
	covers?: string[]; // 메인 이미지들 (여러 장)
	cover?: string; // 단일 메인 이미지
}

const MAX_IMG_RETRY = 2;

// 개별 이미지 컴포넌트 (스피너 유지, 실패 시 이 이미지 1장만 조용히 재시도)
const GalleryImageItem = memo(function GalleryImageItem({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
	const [imgLoading, setImgLoading] = useState(true);
	const [retry, setRetry] = useState(0);
	const retryRef = useRef(0);

	const finalSrc = retry > 0 ? `${src}${src.includes('?') ? '&' : '?'}r=${retry}` : src;

	const handleError = () => {
		if (retryRef.current < MAX_IMG_RETRY) {
			retryRef.current += 1;
			setRetry(retryRef.current);
		} else {
			setImgLoading(true); // 스피너 유지 (placeholder 없음)
		}
	};

	return (
		<>
			<div className={`absolute inset-0 z-50 flex items-center justify-center bg-slate-100 transition-opacity duration-200 ${imgLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-orange-400" />
			</div>
			<div className="absolute inset-0 overflow-hidden">
				<Image
					key={finalSrc}
					src={finalSrc}
					alt={alt}
					fill
					className={`object-cover transition-opacity duration-300 transition-transform group-hover:scale-[1.03] ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
					unoptimized={isProxyImageUrl(src) || isNotionImageUrl(src)}
					priority={priority}
					{...(priority ? {} : { loading: 'lazy' })}
					onLoad={() => setImgLoading(false)}
					onError={handleError}
				/>
			</div>
		</>
	);
}, (prevProps, nextProps) =>
	prevProps.src === nextProps.src &&
	prevProps.priority === nextProps.priority
);

export default function Gallery({ images, covers, cover }: Props) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);

	// 모든 이미지를 합치기 (메인 + 보조)
	const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
	const allImages = unique([...(covers || []), cover, ...images]);

	if (!images || images.length === 0) {
		return <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">추가 이미지가 없습니다.</div>;
	}

	// 보조 이미지 클릭 시 전체 이미지 리스트에서의 인덱스 계산
	const handleImageClick = (galleryIndex: number) => {
		const mainImageCount = unique([...(covers || []), cover]).length;
		setIndex(mainImageCount + galleryIndex);
		setOpen(true);
	};

	return (
		<div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{images.map((src, i) => {
					// 첫 줄만 priority (SSR 기준 PC 3개)
					const priority = i < 3;
					return (
						<button key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border" onClick={() => handleImageClick(i)}>
							<GalleryImageItem
								src={src || '/placeholder.svg'}
								alt={`추가 이미지 ${i + 1}`}
								priority={priority}
							/>
						</button>
					);
				})}
			</div>
			{open && <Lightbox images={allImages} initialIndex={index} onClose={() => setOpen(false)} />}
		</div>
	);
}
