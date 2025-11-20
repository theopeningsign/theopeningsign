"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
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
        // URL이 실제로 변경된 경우에만 리셋
        if (prevCoverRef.current !== cover) {
            prevCoverRef.current = cover;
            
            // 이미지 URL이 없으면 즉시 에러 처리
            if (!cover) {
                setImgError(true);
                setImgLoading(false);
                hasLoadedRef.current = true;
                return;
            }
            
            // URL이 변경되었으므로 로딩 상태 리셋
            setImgLoading(true);
            setImgError(false);
            hasLoadedRef.current = false;
            
            // 타임아웃: 5초 후에도 로드되지 않으면 에러로 처리
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
            loadTimeoutRef.current = setTimeout(() => {
                if (!hasLoadedRef.current) {
                    setImgError(true);
                    setImgLoading(false);
                    hasLoadedRef.current = true;
                }
            }, 5000);
        }
        
        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
        };
    }, [cover]);

    // 초기 마운트 시 이미지가 이미 로드되었는지 확인 (캐시된 이미지 대응)
    useEffect(() => {
        if (cover && !hasLoadedRef.current) {
            // 최후의 안전장치: 일정 시간 후에도 로드되지 않으면 강제로 보이게 함
            const forceShowTimeout = setTimeout(() => {
                if (!hasLoadedRef.current && !imgError) {
                    // 이미지가 로드되지 않았어도 일단 보이게 함 (새로고침 후에는 보일 것)
                    setImgLoading(false);
                    hasLoadedRef.current = true;
                    if (loadTimeoutRef.current) {
                        clearTimeout(loadTimeoutRef.current);
                    }
                }
            }, 500); // 500ms 후 강제로 보이게 함

            return () => clearTimeout(forceShowTimeout);
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
                <div className="absolute inset-0 z-10 animate-pulse bg-slate-200" />
            )}
            {cover && !imgError && (
                <Image
                    src={cover}
                    alt={title}
                    fill
                    className={`object-cover transition-opacity duration-200 group-hover:scale-[1.02] ${hasLoadedRef.current ? 'opacity-100' : (imgLoading ? 'opacity-0' : 'opacity-100')} ${hasLoadedRef.current ? '' : 'transition-opacity duration-200'}`}
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
                        }
                    }}
                    onError={() => {
                        if (!hasLoadedRef.current) {
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current);
                            }
                            setImgError(true);
                            setImgLoading(false);
                            hasLoadedRef.current = true;

                            const errorKey = cover ? `img_error_${cover}` : '';
                            if (errorKey) {
                                scheduleImageReload(errorKey);
                            }
                        }
                    }}
                    onLoadingComplete={() => {
                        if (!hasLoadedRef.current) {
                            if (loadTimeoutRef.current) {
                                clearTimeout(loadTimeoutRef.current);
                            }
                            setImgLoading(false);
                            hasLoadedRef.current = true;
                        }
                        const errorKey = cover ? `img_error_${cover}` : '';
                        if (errorKey) {
                            clearImageReloadFlag(errorKey);
                        }
                    }}
                />
            )}
            {(!cover || imgError) && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
                    <span className="text-sm">Image Placeholder</span>
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


