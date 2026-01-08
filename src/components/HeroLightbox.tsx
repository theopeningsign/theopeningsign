"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl } from '@/lib/notion';
import { scheduleImageReload, clearImageReloadFlag, clearImageErrorFlags } from '@/lib/imageReload';

interface Props {
    cover?: string;
    covers?: string[]; // 메인 이미지가 여러 장일 때
    images: string[]; // 추가 이미지들
    title: string;
    coverIndex?: number; // 현재 클릭한 메인 이미지의 인덱스
}

export default function HeroLightbox({ cover, covers, images, title, coverIndex = 0 }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [imgLoading, setImgLoading] = useState(true); // 초기값을 true로 설정 (PortfolioCard와 동일)
    const [imgError, setImgError] = useState(false);
    const hasLoadedRef = useRef(false); // 이미지가 한 번 로드되었는지 추적
    const prevCoverRef = useRef<string | undefined>(cover);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);
    const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
    const allImages = unique([...(covers || []), cover, ...images]);

    // 페이지 진입 시 세션 플래그 초기화
    useEffect(() => {
        clearImageErrorFlags();
    }, []);

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
            try {
                const img = document.createElement('img');
                let cacheChecked = false;
                
                img.onload = () => {
                    if (isMountedRef.current && !hasLoadedRef.current && !cacheChecked) {
                        cacheChecked = true;
                        // 이미지가 캐시에 있으면 즉시 로드 완료 처리
                        try {
                            setImgLoading(false);
                            setImgError(false);
                            hasLoadedRef.current = true;
                            // sessionStorage에 로드 상태 저장 (refresh 후 복원용, 단기간만 유효)
                            const loadedKey = `img_loaded_${cover}`;
                            sessionStorage.setItem(loadedKey, 'true');
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current);
                            }
                        } catch (e) {
                            // 상태 업데이트 중 에러 발생 시 무시 (컴포넌트 언마운트 등)
                            console.error('[HeroLightbox] 이미지 로드 상태 업데이트 실패:', e);
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
            } catch (e) {
                // 이미지 생성 중 에러 발생 시 무시
                console.error('[HeroLightbox] 이미지 캐시 확인 실패:', e);
            }
        }
    }, [cover, imgError]);

    // 탭이 포그라운드로 돌아올 때 이미지 로딩 상태 재확인 (백그라운드에서 실패한 경우 대응)
    useEffect(() => {
        if (typeof window === 'undefined' || !cover) return;
        
        const timeoutIds = new Set<NodeJS.Timeout>();
        const imgObjects = new Set<HTMLImageElement>();
        
        const handleVisibilityChange = () => {
            // 탭이 포그라운드로 돌아왔고, 이미지가 아직 로드되지 않았을 때만 재확인
            if (document.visibilityState === 'visible' && !hasLoadedRef.current && imgLoading && isMountedRef.current) {
                // 약간의 지연을 두어 브라우저가 네트워크를 다시 활성화할 시간을 줌
                const timeoutId = setTimeout(() => {
                    if (!hasLoadedRef.current && cover && isMountedRef.current) {
                        try {
                            const img = document.createElement('img');
                            imgObjects.add(img);
                            
                            img.onload = () => {
                                if (!hasLoadedRef.current && isMountedRef.current) {
                                    try {
                                        setImgLoading(false);
                                        setImgError(false);
                                        hasLoadedRef.current = true;
                                        if (cover) {
                                            sessionStorage.setItem(`img_loaded_${cover}`, 'true');
                                        }
                                        if (loadTimeoutRef.current) {
                                            clearTimeout(loadTimeoutRef.current);
                                        }
                                    } catch (e) {
                                        console.error('[HeroLightbox] 이미지 재확인 상태 업데이트 실패:', e);
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
                            img.src = cover;
                        } catch (e) {
                            console.error('[HeroLightbox] 이미지 재확인 실패:', e);
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
    }, [cover, imgLoading]);

    // 컴포넌트 언마운트 시 최종 cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
        };
    }, []);

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
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-orange-400" />
                        <span className="text-xs text-slate-400">이미지 로딩 중...</span>
                    </div>
                </div>
            )}
            {cover && (
                <div className="absolute inset-0 overflow-hidden bg-slate-100">
                    <Image
                        src={cover}
                        alt={title}
                        fill
                        className={`object-cover transition-opacity duration-200 group-hover:scale-[1.02] ${(imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'opacity-0' : 'opacity-100'} ${imgError && !hasLoadedRef.current ? 'hidden' : ''}`}
                        priority
                        unoptimized={isNotionImageUrl(cover)}
                        onLoad={() => {
                        // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
                        if (!isMountedRef.current) return;
                        
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
                        // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
                        if (!isMountedRef.current) return;
                        
                        if (!hasLoadedRef.current) {
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current);
                            }
                            setImgError(true);
                            // 에러 발생해도 스피너를 계속 보여줌 (사용자는 로딩 중인 것으로 인식)
                            setImgLoading(true); // 스피너 계속 표시
                            // hasLoadedRef는 true로 설정하지 않아서 재시도 가능하게 함

                            // 에러 발생 시 재시도는 지연시켜서 상태 리셋 방지
                            // 안정적인 키(페이지 경로 + 이미지 슬롯)로 재시도 횟수를 관리해 무한 루프를 차단합니다.
                            const errorKey = pathname ? `hero:${pathname}:cover:${coverIndex}` : `hero:cover:${coverIndex}`;
                            if (errorKey) {
                                // 기존 timeout이 있으면 clear
                                if (retryTimeoutRef.current) {
                                    clearTimeout(retryTimeoutRef.current);
                                }
                                // 재시도를 0.5초 후에 수행하여 즉시 상태 리셋 방지
                                retryTimeoutRef.current = setTimeout(() => {
                                    if (isMountedRef.current) {
                                        scheduleImageReload(errorKey, router);
                                    }
                                }, 500);
                            }
                        }
                    }}
                    style={{ 
                        visibility: (imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'hidden' : 'visible',
                        display: (imgLoading && !hasLoadedRef.current) || (imgError && !hasLoadedRef.current) ? 'none' : 'block',
                        willChange: 'opacity',
                        transform: 'translateZ(0)'
                    }}
                    />
                </div>
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


