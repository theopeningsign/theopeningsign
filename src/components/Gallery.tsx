"use client";

import Image from 'next/image';
import { useState, useRef, memo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl } from '@/lib/notion';
import { scheduleImageReload, clearImageReloadFlag } from '@/lib/imageReload';

interface Props {
	images: string[]; // 보조 이미지들
	covers?: string[]; // 메인 이미지들 (여러 장)
	cover?: string; // 단일 메인 이미지
}

// 개별 이미지 컴포넌트
const GalleryImageItem = memo(function GalleryImageItem({ src, alt, priority = false, router, errorKey }: { src: string; alt: string; priority?: boolean; router: { refresh: () => void }; errorKey: string }) {
	const [imgLoading, setImgLoading] = useState(true);
	const [imgError, setImgError] = useState(false);
	const hasLoadedRef = useRef(false);
	const prevSrcRef = useRef<string | undefined>(src);
	const isMountedRef = useRef(true);
	const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
			// sessionStorage는 신뢰하지 않고, 항상 실제 이미지 로드를 확인
			// 브라우저 캐시에 이미지가 있는지 확인
			try {
				const img = document.createElement('img');
				img.onload = () => {
					// 이미지가 캐시에 있으면 즉시 로딩 완료 상태로 설정
					if (isMountedRef.current && !hasLoadedRef.current) {
						try {
							setImgLoading(false);
							setImgError(false);
							hasLoadedRef.current = true;
							// sessionStorage에 로드 상태 저장 (refresh 후 복원용, 단기간만 유효)
							const loadedKey = `img_loaded_${src}`;
							sessionStorage.setItem(loadedKey, 'true');
						} catch (e) {
							// 상태 업데이트 중 에러 발생 시 무시 (컴포넌트 언마운트 등)
							console.error('[Gallery] 이미지 로드 상태 업데이트 실패:', e);
						}
					}
				};
				img.onerror = () => {
					// 캐시에 없으면 로딩 상태 유지 (실제 Image 컴포넌트가 로드 시도)
				};
				img.src = src;
				
				// 타임아웃 제거: 에러가 나도 스피너를 계속 보여주기 위해 강제 표시하지 않음

				return () => {
					img.onload = null;
					img.onerror = null;
				};
			} catch (e) {
				// 이미지 생성 중 에러 발생 시 무시
				console.error('[Gallery] 이미지 캐시 확인 실패:', e);
			}
		}
	}, [src, imgError]);

	// 탭이 포그라운드로 돌아올 때 이미지 로딩 상태 재확인 (백그라운드에서 실패한 경우 대응)
	useEffect(() => {
		if (typeof window === 'undefined' || !src) return;
		
		const timeoutIds = new Set<NodeJS.Timeout>();
		const imgObjects = new Set<HTMLImageElement>();
		
		const handleVisibilityChange = () => {
			// 탭이 포그라운드로 돌아왔고, 이미지가 아직 로드되지 않았을 때만 재확인
			if (document.visibilityState === 'visible' && !hasLoadedRef.current && imgLoading && isMountedRef.current) {
				// 약간의 지연을 두어 브라우저가 네트워크를 다시 활성화할 시간을 줌
				const timeoutId = setTimeout(() => {
					if (!hasLoadedRef.current && src && isMountedRef.current) {
						try {
							const img = document.createElement('img');
							imgObjects.add(img);
							
							img.onload = () => {
								if (!hasLoadedRef.current && isMountedRef.current) {
									try {
										setImgLoading(false);
										setImgError(false);
										hasLoadedRef.current = true;
										if (src) {
											sessionStorage.setItem(`img_loaded_${src}`, 'true');
										}
									} catch (e) {
										console.error('[Gallery] 이미지 재확인 상태 업데이트 실패:', e);
									}
								}
								// cleanup
								img.onload = null;
								img.onerror = null;
								imgObjects.delete(img);
							};
							img.onerror = () => {
								// 재확인 실패 시 아무것도 하지 않음 (무한 루프 방지)
								// 실제 에러 처리는 기존 onError에서만 수행
								// cleanup
								img.onload = null;
								img.onerror = null;
								imgObjects.delete(img);
							};
							img.src = src;
						} catch (e) {
							console.error('[Gallery] 이미지 재확인 실패:', e);
						}
					}
					timeoutIds.delete(timeoutId);
				}, 300);
				timeoutIds.add(timeoutId);
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			// 모든 timeout 정리
			timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
			timeoutIds.clear();
			// 모든 img 객체 정리
			imgObjects.forEach(img => {
				img.onload = null;
				img.onerror = null;
			});
			imgObjects.clear();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [src, imgLoading]);

	// 컴포넌트 언마운트 시 최종 cleanup
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}
		};
	}, []);

	const handleLoad = () => {
		// 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
		if (!isMountedRef.current) return;
		
		// 이미지가 로드되면 영구적으로 로딩 완료 상태 유지
		setImgLoading(false);
		setImgError(false);
		hasLoadedRef.current = true;
		// sessionStorage에 로드 상태 저장 (refresh 후 복원용)
		if (src) {
			sessionStorage.setItem(`img_loaded_${src}`, 'true');
		}
		clearImageReloadFlag(errorKey);
	};

	const handleError = () => {
		// 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
		if (!isMountedRef.current) return;
		
		if (!hasLoadedRef.current) {
			// 에러가 발생해도 스피너를 계속 보여줌 (사용자는 로딩 중인 것으로 인식)
			setImgError(true);
			setImgLoading(true); // 스피너 계속 표시
			// hasLoadedRef는 true로 설정하지 않아서 재시도 가능하게 함

			// 서버 컴포넌트만 갱신 (부드러운 갱신, 사용자 경험 방해 최소화)
			// 재시도를 지연시켜서 즉시 상태 리셋 방지
			if (src) {
				// 기존 timeout이 있으면 clear
				if (retryTimeoutRef.current) {
					clearTimeout(retryTimeoutRef.current);
				}
				retryTimeoutRef.current = setTimeout(() => {
					if (isMountedRef.current) {
						scheduleImageReload(errorKey, router);
					}
				}, 500);
			}
		}
	};

	return (
		<>
			{imgLoading && !hasLoadedRef.current && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-orange-400" />
                </div>
			)}
			{src && (
				<div className="absolute inset-0 overflow-hidden">
					<Image 
						src={src} 
						alt={alt} 
						fill 
						className={`object-cover transition-opacity duration-200 transition-transform group-hover:scale-[1.03] ${(imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'opacity-0' : 'opacity-100'} ${imgError && !hasLoadedRef.current ? 'hidden' : ''}`}
						unoptimized={isNotionImageUrl(src)}
						priority={priority}
						{...(priority ? {} : { loading: 'lazy' })}
						onLoad={handleLoad}
						onError={handleError}
					style={{ 
						visibility: (imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'hidden' : 'visible',
						display: (imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'none' : 'block',
						willChange: 'opacity',
						transform: 'translateZ(0)'
					}}
					/>
				</div>
			)}
		</>
	);
}, (prevProps, nextProps) =>
	prevProps.src === nextProps.src &&
	prevProps.priority === nextProps.priority &&
	prevProps.router === nextProps.router &&
	prevProps.errorKey === nextProps.errorKey
);

export default function Gallery({ images, covers, cover }: Props) {
	const router = useRouter();
	const pathname = usePathname();
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
					// SSR과 클라이언트에서 동일한 값 사용 (hydration mismatch 방지)
					// 기본값 3개로 설정하고, 클라이언트에서만 동적으로 조정
					const isFirstRow = i < 3; // SSR 기본값: PC 기준 3개
					const priority = isFirstRow;
					// URL이 변해도 변하지 않는 안정적인 키로 재시도 횟수를 관리
					const errorKey = pathname ? `gallery:${pathname}:${i}` : `gallery:${i}`;
					
					return (
						<button key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border" onClick={() => handleImageClick(i)}>
							<GalleryImageItem 
								src={src || '/placeholder.svg'} 
								alt={`추가 이미지 ${i+1}`}
								priority={priority}
								router={router}
								errorKey={errorKey}
							/>
						</button>
					);
				})}
			</div>
			{open && <Lightbox images={allImages} initialIndex={index} onClose={() => setOpen(false)} />}
		</div>
	);
}



