"use client";

import Image from 'next/image';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';

export default function Gallery({ images }: { images: string[] }) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);

	if (!images || images.length === 0) {
		return <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">추가 이미지가 없습니다.</div>;
	}

	return (
		<div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{images.map((src, i) => (
					<button key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border" onClick={() => { setIndex(i); setOpen(true); }}>
						<Image src={src || '/placeholder.svg'} alt={`추가 이미지 ${i+1}`} fill className="object-cover transition-transform group-hover:scale-[1.03]" />
					</button>
				))}
			</div>
			{open && <Lightbox images={images} initialIndex={index} onClose={() => setOpen(false)} />}
		</div>
	);
}



