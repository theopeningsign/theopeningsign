"use client";

import Image from 'next/image';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';

interface Props {
	images: string[]; // 보조 이미지들
	covers?: string[]; // 메인 이미지들 (여러 장)
	cover?: string; // 단일 메인 이미지
}

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
						<Image src={src || '/placeholder.svg'} alt={`추가 이미지 ${i+1}`} fill className="object-cover transition-transform group-hover:scale-[1.03]" />
					</button>
				))}
			</div>
			{open && <Lightbox images={allImages} initialIndex={index} onClose={() => setOpen(false)} />}
		</div>
	);
}



