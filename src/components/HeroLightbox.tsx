"use client";

import Image from 'next/image';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';
import { isNotionImageUrl } from '@/lib/notion';

interface Props {
    cover?: string;
    covers?: string[]; // 메인 이미지가 여러 장일 때
    images: string[]; // 추가 이미지들
    title: string;
    coverIndex?: number; // 현재 클릭한 메인 이미지의 인덱스
}

export default function HeroLightbox({ cover, covers, images, title, coverIndex = 0 }: Props) {
    const [open, setOpen] = useState(false);
    const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
    const allImages = unique([...(covers || []), cover, ...images]);

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
            <Image
                src={cover || '/placeholder.svg'}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority
                unoptimized={cover ? isNotionImageUrl(cover) : false} // Notion 이미지만 최적화 비활성화 (Vercel Cache Writes 초과 방지)
            />
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


