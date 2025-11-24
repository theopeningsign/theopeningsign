"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl } from '@/lib/notion';
import { scheduleImageReload, clearImageReloadFlag } from '@/lib/imageReload';

interface Props {
    cover?: string;
    covers?: string[]; // 메인 이미지가 여러 장일 때
    images: string[]; // 추가 이미지들
    title: string;
    coverIndex?: number; // 현재 클릭한 메인 이미지의 인덱스
}

export default function HeroLightbox({ cover, covers, images, title, coverIndex = 0 }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [imgLoading, setImgLoading] = useState(true); // 초기값을 true로 설정 (PortfolioCard와 동일)
    const [imgError, setImgError] = useState(false);
    const hasLoadedRef = useRef(false); // 이미지가 한 번 로드되었는지 추적
    const prevCoverRef = useRef<string | undefined>(cover);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
    const allImages = unique([...(covers || []), cover, ...images]);

    // 이미지 URL이 변경되면 상태 리셋
    useEffect(() => {
        // URL이 실제로 변경된 경우에만 리셋 (refresh 중이면 같은 URL은 리셋하지 않음)
        const isRefreshing = typeof window !== 'undefined' && sessionStorage.getItem('isRefreshing') === 'true';
        const urlChanged = prevCoverRef.current !== cover;
        const isSameUrl = prevCoverRef.current && cover && prevCoverRef.current === cover;
        
        if (urlChanged && !(isRefreshing && isSameUrl)) {
            prevCoverRef.current = cover;
            
            // 이미지 URL이 없으면 즉시 에러 처리
            if (!cover) {
                setImgError(true);
                setImgLoading(false);
                hasLoadedRef.current = true;
                return;
            }
            
            // refresh 중이 아니거나 URL이 실제로 변경된 경우에만 로딩 상태 리셋
            if (!isRefreshing || !isSameUrl) {
                setImgLoading(true);
                setImgError(false);
                hasLoadedRef.current = false;
            }
            
            // 타임아웃 제거: 에러가 나도 스피너를 계속 보여주기 위해 타임아웃으로 로딩 상태를 종료하지 않음
        }
        
        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
        };
    }, [cover]);

    // 초기 마운트 시 이미지가 이미 로드되었는지 확인 (캐시된 이미지 대응 + refresh 후 상태 복원)
    useEffect(() => {
        // 이미 로드된 이미지는 아무것도 하지 않음 (무한 루프 방지)
        if (hasLoadedRef.current) {
            return;
        }
        
        if (cover && typeof window !== 'undefined') {
            // sessionStorage는 신뢰하지 않고, 항상 실제 이미지 로드를 확인
            // 브라우저 캐시에 이미지가 있는지 먼저 확인
            const img = document.createElement('img');
            let cacheChecked = false;
            
            img.onload = () => {
                if (!hasLoadedRef.current && !cacheChecked) {
                    cacheChecked = true;
                    // 이미지가 캐시에 있으면 즉시 로드 완료 처리
                    setImgLoading(false);
                    setImgError(false);
                    hasLoadedRef.current = true;
                    // sessionStorage에 로드 상태 저장 (refresh 후 복원용, 단기간만 유효)
                    const loadedKey = `img_loaded_${cover}`;
                    sessionStorage.setItem(loadedKey, 'true');
                    if (loadTimeoutRef.current) {
                        clearTimeout(loadTimeoutRef.current);
                    }
                }
            };
            
            img.onerror = () => {
                cacheChecked = true;
                // 캐시에 없으면 로딩 상태 유지 (실제 Image 컴포넌트가 로드 시도)
            };
            
            img.src = cover;
            
            // 타임아웃 제거: 에러가 나도 스피너를 계속 보여주기 위해 강제 표시하지 않음

            return () => {
                img.onload = null;
                img.onerror = null;
            };
        }
    }, [cover, imgError]);

    // 클릭한 이미지가 전체 리스트에서 몇 번째인지 계산
    // covers 배열에서 cover의 인덱스를 찾거나, 전달받은 coverIndex 사용
    const getInitialIndex = () => {
        if (coverIndex !== undefined && covers && covers.length > 0) {
            // covers 배열에서 현재 cover의 인덱스 찾기
            const indexInCovers = covers.findIndex(c => c === cover);
            return indexInCovers >= 0 ? indexInCovers : 0;
        }
        return 0;
    };

    return (
        <div className="group relative w-full aspect-[16/9] overflow-hidden rounded-xl border">
            {imgLoading && !hasLoadedRef.current && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-orange-400" />
                        <span className="text-xs text-slate-400">이미지 로딩 중...</span>
                    </div>
                </div>
            )}
            {cover && (
                <Image
                    src={cover}
                    alt={title}
                    fill
                    className={`object-cover transition-opacity duration-200 group-hover:scale-[1.02] ${(imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'opacity-0' : 'opacity-100'} ${imgError && !hasLoadedRef.current ? 'hidden' : ''}`}
                    priority
                    unoptimized={isNotionImageUrl(cover)}
                    onLoad={() => {
                        if (!hasLoadedRef.current) {
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current);
                            }
                            setImgLoading(false);
                            setImgError(false);
                            hasLoadedRef.current = true;
                            // sessionStorage에 로드 상태 저장 (refresh 후 복원용)
                            if (cover) {
                                sessionStorage.setItem(`img_loaded_${cover}`, 'true');
                            }
                            const errorKey = cover ? `img_error_${cover}` : '';
                            if (errorKey) {
                                clearImageReloadFlag(errorKey);
                            }
                        }
                    }}
                    onError={() => {
                        if (!hasLoadedRef.current) {
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current);
                            }
                            setImgError(true);
                            // 에러 발생해도 스피너를 계속 보여줌 (사용자는 로딩 중인 것으로 인식)
                            setImgLoading(true); // 스피너 계속 표시
                            // hasLoadedRef는 true로 설정하지 않아서 재시도 가능하게 함

                            // 에러 발생 시 재시도는 지연시켜서 상태 리셋 방지
                            const errorKey = cover ? `img_error_${cover}` : '';
                            if (errorKey) {
                                // 재시도를 1초 후에 수행하여 즉시 상태 리셋 방지
                                setTimeout(() => {
                                    scheduleImageReload(errorKey, router);
                                }, 1000);
                            }
                        }
                    }}
                />
            )}
            <button
                type="button"
                aria-label="메인 이미지 확대"
                onClick={() => setOpen(true)}
                className="absolute inset-0 z-10 cursor-zoom-in"
            />
            {open && (
                <Lightbox images={allImages} initialIndex={getInitialIndex()} onClose={() => setOpen(false)} />
            )}
        </div>
    );
}


