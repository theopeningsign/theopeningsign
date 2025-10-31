// 이미지 라이트박스 컴포넌트
"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
	images: string[];
	initialIndex?: number;
	onClose: () => void;
}

export default function Lightbox({ images, initialIndex = 0, onClose }: Props) {
	const [index, setIndex] = useState(initialIndex);
	const [zoomed, setZoomed] = useState(false);
	const total = images.length;
	const current = useMemo(() => images[index], [images, index]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
			if (e.key === 'ArrowLeft') setIndex((p) => (p - 1 + total) % total);
			if (e.key === 'ArrowRight') setIndex((p) => (p + 1) % total);
		}
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose, total]);

	function goPrev() { setIndex((p) => (p - 1 + total) % total); }
	function goNext() { setIndex((p) => (p + 1) % total); }

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
			<div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
				<button aria-label="닫기" className="absolute right-2 top-2 z-20 rounded bg-white/20 p-2 text-white hover:bg-white/30" onClick={onClose}>
					<X />
				</button>
				{/* 좌/우 대형 클릭 영역 - 화면 끝, 전체 높이 */}
				<button aria-label="이전" className="absolute left-0 top-0 z-10 h-full w-[16vw] min-w-[120px] cursor-pointer bg-transparent hover:bg-white/5" onClick={goPrev} />
				<button aria-label="다음" className="absolute right-0 top-0 z-10 h-full w-[16vw] min-w-[120px] cursor-pointer bg-transparent hover:bg-white/5" onClick={goNext} />

				{/* 표시용 화살표 버튼 */}
				<button aria-label="이전" className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded bg-white/20 p-3 text-white hover:bg-white/30" onClick={goPrev}>
					<ChevronLeft />
				</button>
				<button aria-label="다음" className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded bg-white/20 p-3 text-white hover:bg-white/30" onClick={goNext}>
					<ChevronRight />
				</button>

				<div className="flex h-full items-center justify-center">
					<div className={zoomed ? 'relative w-[96vw] h-[86vh]' : 'relative w-[80vw] max-w-5xl aspect-video'}>
						<Image
							src={current || '/placeholder.svg'}
							alt={`이미지 ${index + 1}`}
							fill
							className={zoomed ? 'object-contain cursor-zoom-out' : 'object-contain cursor-zoom-in'}
							priority
							onClick={() => setZoomed((z) => !z)}
						/>
					</div>
				</div>
				<div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded bg-white/20 px-2 py-1 text-sm text-white">{index + 1} / {total}</div>
			</div>
		</div>
	);
}


