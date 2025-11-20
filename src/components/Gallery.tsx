"use client";

import Image from 'next/image';
import { useState, useRef, memo, useEffect } from 'react';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl } from '@/lib/notion';

interface Props {
	images: string[]; // 보조 이미지들
	covers?: string[]; // 메인 이미지들 (여러 장)
	cover?: string; // 단일 메인 이미지
}

// 개별 이미지 컴포넌트
const GalleryImageItem = memo(function GalleryImageItem({ src, alt }: { src: string; alt: string }) {
	const [imgLoading, setImgLoading] = useState(true);
	const [imgError, setImgError] = useState(false);
	const hasLoadedRef = useRef(false);
	const prevSrcRef = useRef<string | undefined>(src);

	useEffect(() => {
		if (prevSrcRef.current !== src) {
			prevSrcRef.current = src;
			setImgLoading(true);
			setImgError(false);
			hasLoadedRef.current = false;
		}
	}, [src]);

	// 초기 마운트 시 이미지가 이미 로드되었는지 확인 (캐시된 이미지 대응)
	useEffect(() => {
		if (src && !hasLoadedRef.current) {
			// 최후의 안전장치: 일정 시간 후에도 로드되지 않으면 강제로 보이게 함
			const forceShowTimeout = setTimeout(() => {
				if (!hasLoadedRef.current && !imgError) {
					setImgLoading(false);
					hasLoadedRef.current = true;
				}
			}, 500); // 500ms 후 강제로 보이게 함

			return () => clearTimeout(forceShowTimeout);
		}
	}, [src, imgError]);

	const handleLoad = () => {
		if (!hasLoadedRef.current) {
			setImgLoading(false);
			setImgError(false);
			hasLoadedRef.current = true;
		}
	};

	const handleError = () => {
		if (!hasLoadedRef.current) {
			setImgError(true);
			setImgLoading(false);
			hasLoadedRef.current = true;
		}
	};

	return (
		<>
			{imgLoading && !hasLoadedRef.current && (
				<div className="absolute inset-0 z-10 animate-pulse bg-slate-200" />
			)}
			<Image 
				src={imgError ? '/placeholder.svg' : (src || '/placeholder.svg')} 
				alt={alt} 
				fill 
				className={`object-cover transition-transform group-hover:scale-[1.03] ${hasLoadedRef.current ? 'opacity-100' : (imgLoading ? 'opacity-0' : 'opacity-100')} ${hasLoadedRef.current ? '' : 'transition-opacity duration-200'}`}
				unoptimized={src ? isNotionImageUrl(src) : false}
				loading="lazy"
				onLoad={handleLoad}
				onError={handleError}
				onLoadingComplete={() => {
					if (!hasLoadedRef.current) {
						setImgLoading(false);
						hasLoadedRef.current = true;
					}
				}}
			/>
		</>
	);
}, (prevProps, nextProps) => prevProps.src === nextProps.src);

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
		// 메인 이미지 개수만큼 오프셋 추가
		const mainImageCount = unique([...(covers || []), cover]).length;
		const actualIndex = mainImageCount + galleryIndex;
		setIndex(actualIndex);
		setOpen(true);
	};

	return (
		<div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{images.map((src, i) => (
					<button key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border" onClick={() => handleImageClick(i)}>
						<GalleryImageItem 
							src={src || '/placeholder.svg'} 
							alt={`추가 이미지 ${i+1}`} 
						/>
					</button>
				))}
			</div>
			{open && <Lightbox images={allImages} initialIndex={index} onClose={() => setOpen(false)} />}
		</div>
	);
}



