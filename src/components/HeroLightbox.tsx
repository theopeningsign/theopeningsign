"use client";

import Image from 'next/image';
import { useState, useRef } from 'react';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl, isProxyImageUrl } from '@/lib/notion';

interface Props {
    cover?: string;
    covers?: string[]; // 메인 이미지가 여러 장일 때
    images: string[]; // 추가 이미지들
    title: string;
    coverIndex?: number; // 현재 클릭한 메인 이미지의 인덱스
}

const MAX_IMG_RETRY = 2;

export default function HeroLightbox({ cover, covers, images, title, coverIndex = 0 }: Props) {
    const [open, setOpen] = useState(false);
    const [imgLoading, setImgLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    const retryRef = useRef(0);

    const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
    const allImages = unique([...(covers || []), cover, ...images]);

    const finalSrc = cover ? (retry > 0 ? `${cover}${cover.includes('?') ? '&' : '?'}r=${retry}` : cover) : '';

    const handleError = () => {
        if (retryRef.current < MAX_IMG_RETRY) {
            retryRef.current += 1;
            setRetry(retryRef.current);
        } else {
            setImgLoading(true); // 스피너 유지 (placeholder 없음)
        }
    };

    // 클릭한 이미지가 covers 배열에서 몇 번째인지 계산
    const getInitialIndex = () => {
        if (covers && covers.length > 0) {
            const indexInCovers = covers.findIndex(c => c === cover);
            return indexInCovers >= 0 ? indexInCovers : 0;
        }
        return 0;
    };

    return (
        <div className="group relative w-full aspect-[16/9] overflow-hidden rounded-xl border bg-slate-100">
            <div className={`absolute inset-0 z-50 flex items-center justify-center bg-slate-100 transition-opacity duration-200 ${imgLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-orange-400" />
                    <span className="text-xs text-slate-400">이미지 로딩 중...</span>
                </div>
            </div>
            {cover && (
                <div className="absolute inset-0 overflow-hidden">
                    <Image
                        key={finalSrc}
                        src={finalSrc}
                        alt={title}
                        fill
                        className={`object-cover transition-opacity duration-300 group-hover:scale-[1.02] ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                        priority
                        unoptimized={isProxyImageUrl(cover) || isNotionImageUrl(cover)}
                        onLoad={() => setImgLoading(false)}
                        onError={handleError}
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
