"use client";

import Image from 'next/image';
import { useState, useRef, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl } from '@/lib/notion';
import { scheduleImageReload, clearImageReloadFlag } from '@/lib/imageReload';

interface Props {
	images: string[]; // 보조 이미지들
	covers?: string[]; // 메인 이미지들 (여러 장)
	cover?: string; // 단일 메인 이미지
}

// 개별 이미지 컴포넌트
const GalleryImageItem = memo(function GalleryImageItem({ src, alt, priority = false, router }: { src: string; alt: string; priority?: boolean; router: { refresh: () => void } }) {
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

	// 초기 마운트 시 이미지가 이미 로드되었는지 확인 (캐시된 이미지 대응 + refresh 후 상태 복원)
	useEffect(() => {
		// 이미 로드된 이미지는 아무것도 하지 않음 (무한 루프 방지)
		if (hasLoadedRef.current) {
			return;
		}
		
		if (src && typeof window !== 'undefined') {
			// router.refresh() 후에도 상태 유지: sessionStorage에서 로드 상태 확인
			const loadedKey = `img_loaded_${src}`;
			const wasLoaded = sessionStorage.getItem(loadedKey) === 'true';
			
			if (wasLoaded) {
				// 이전에 로드된 이미지면 즉시 로드 완료 처리 (refresh 후 깜빡임 방지)
				setImgLoading(false);
				setImgError(false);
				hasLoadedRef.current = true;
				return;
			}
			
			// 브라우저 캐시에 이미지가 있는지 확인
			const img = document.createElement('img');
			img.onload = () => {
				// 이미지가 캐시에 있으면 즉시 로딩 완료 상태로 설정
				if (!hasLoadedRef.current) {
					setImgLoading(false);
					setImgError(false);
					hasLoadedRef.current = true;
					// sessionStorage에 로드 상태 저장 (refresh 후 복원용)
					sessionStorage.setItem(loadedKey, 'true');
				}
			};
			img.src = src;
			
			// 최후의 안전장치: 일정 시간 후에도 로드되지 않으면 강제로 보이게 함 (모바일 네트워크 지연 고려)
			const forceShowTimeout = setTimeout(() => {
				if (!hasLoadedRef.current && !imgError) {
					setImgLoading(false);
					hasLoadedRef.current = true;
				}
			}, 2000); // 2초 후 강제로 보이게 함 (안정성 우선)

			return () => {
				img.onload = null;
				clearTimeout(forceShowTimeout);
			};
		}
	}, [src, imgError]);

	const handleLoad = () => {
		// 이미지가 로드되면 영구적으로 로딩 완료 상태 유지
		setImgLoading(false);
		setImgError(false);
		hasLoadedRef.current = true;
		// sessionStorage에 로드 상태 저장 (refresh 후 복원용)
		if (src) {
			sessionStorage.setItem(`img_loaded_${src}`, 'true');
		}
		clearImageReloadFlag(src ? `img_error_${src}` : '');
	};

	const handleError = () => {
		if (!hasLoadedRef.current) {
			// 에러가 발생해도 원본 이미지를 계속 시도 (안정성 우선)
			// imgError는 true로 설정하되, 원본 URL은 계속 사용
			setImgError(true);
			setImgLoading(false);
			hasLoadedRef.current = true;

			// 서버 컴포넌트만 갱신 (부드러운 갱신, 사용자 경험 방해 최소화)
			if (src) {
				scheduleImageReload(`img_error_${src}`, router);
			}
		}
	};

	return (
		<>
			{imgLoading && !hasLoadedRef.current && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-orange-400" />
                </div>
			)}
			{src && (
				<Image 
					src={src} 
					alt={alt} 
					fill 
					className={`object-cover transition-opacity duration-200 transition-transform group-hover:scale-[1.03] ${(imgLoading && !hasLoadedRef.current) ? 'opacity-0' : 'opacity-100'}`}
					unoptimized={isNotionImageUrl(src)}
					priority={priority}
					loading={priority ? undefined : 'lazy'}
					onLoad={handleLoad}
					onError={handleError}
				/>
			)}
		</>
	);
}, (prevProps, nextProps) => prevProps.src === nextProps.src && prevProps.priority === nextProps.priority && prevProps.router === nextProps.router);

export default function Gallery({ images, covers, cover }: Props) {
	const router = useRouter();
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
				{images.map((src, i) => {
					// 첫 줄만 priority: 모바일(1개), 태블릿(2개), PC(3개)
					const isFirstRow = i < 3; // PC 기준 첫 줄 (3개)
					const priority = isFirstRow;
					
					return (
						<button key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border" onClick={() => handleImageClick(i)}>
							<GalleryImageItem 
								src={src || '/placeholder.svg'} 
								alt={`추가 이미지 ${i+1}`}
								priority={priority}
								router={router}
							/>
						</button>
					);
				})}
			</div>
			{open && <Lightbox images={allImages} initialIndex={index} onClose={() => setOpen(false)} />}
		</div>
	);
}



