"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
	images: string[];
	intervalMs?: number; // 한 장당 노출 시간
}

// 메인 히어로 배경 슬라이드쇼
// - 방문할 때마다 사진 순서를 무작위(랜덤)로 섞어서 보여줌
// - 크로스페이드 전환 + 켄번스(느린 줌) 효과
// - 위에 다크 오버레이를 깔아 로고/문구 가독성 유지
// - 장식용이므로 pointer-events 없음 (클릭은 상위 Link가 처리)
export default function HeroSlideshow({ images, intervalMs = 5500 }: Props) {
	// 초기값은 서버 순서(SSR 일치 → 하이드레이션 mismatch 방지), 마운트 후 클라이언트에서 섞음
	const [order, setOrder] = useState(images);
	const [current, setCurrent] = useState(0);

	// 마운트 시 한 번 무작위로 섞기 (Fisher-Yates)
	useEffect(() => {
		const shuffled = [...images];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		setOrder(shuffled);
		setCurrent(0);
	}, [images]);

	// 일정 간격으로 다음 사진으로 전환
	useEffect(() => {
		if (order.length <= 1) return;
		const id = setInterval(() => {
			setCurrent((prev) => (prev + 1) % order.length);
		}, intervalMs);
		return () => clearInterval(id);
	}, [order.length, intervalMs]);

	if (order.length === 0) return null;

	return (
		<div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden="true">
			{order.map((src, i) => (
				<div
					key={src}
					className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
					style={{ opacity: i === current ? 1 : 0 }}
				>
					<Image
						src={src}
						alt=""
						fill
						priority={i === 0}
						unoptimized
						sizes="100vw"
						className="object-cover"
						style={{
							// 활성 슬라이드만 천천히 줌인 (켄번스)
							transform: i === current ? 'scale(1.08)' : 'scale(1)',
							transition: 'transform 7000ms ease-out',
						}}
					/>
				</div>
			))}
			{/* 시네마틱 오버레이 — 사진은 살리되 흰 글씨가 또렷하게 (은은한 다크 + 비네팅) */}
			<div className="absolute inset-0 bg-black/30" />
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/45" />
			<div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0,0,0,0.45) 100%)' }} />
		</div>
	);
}
