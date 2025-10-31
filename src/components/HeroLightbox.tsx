"use client";

import Image from 'next/image';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';

interface Props {
    cover?: string;
    covers?: string[]; // 메인 이미지가 여러 장일 때
    images: string[]; // 추가 이미지들
    title: string;
}

export default function HeroLightbox({ cover, covers, images, title }: Props) {
    const [open, setOpen] = useState(false);
    const unique = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
    const allImages = unique([...(covers || []), cover, ...images]);

    return (
        <div className="group relative w-full aspect-[16/9] overflow-hidden rounded-xl border">
            <Image
                src={cover || '/placeholder.svg'}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority
            />
            <button
                type="button"
                aria-label="메인 이미지 확대"
                onClick={() => setOpen(true)}
                className="absolute inset-0 z-10 cursor-zoom-in"
            />
            {open && (
                <Lightbox images={allImages} initialIndex={0} onClose={() => setOpen(false)} />
            )}
        </div>
    );
}


