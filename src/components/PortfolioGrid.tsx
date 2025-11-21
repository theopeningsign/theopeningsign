"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import PortfolioCard from './PortfolioCard';
import { PortfolioItem } from '@/lib/types';

interface Props {
	items: PortfolioItem[];
	priorityCount?: number; // priority 이미지 개수 (기본값: 12)
}

export default function PortfolioGrid({ items, priorityCount = 12 }: Props) {
	const [loadedPriorityCount, setLoadedPriorityCount] = useState(0);
	const [showPriorityImages, setShowPriorityImages] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handlePriorityLoad = useCallback(() => {
		setLoadedPriorityCount((prev) => {
			const newCount = prev + 1;
			// 모든 priority 이미지가 로드되면 전환 시작
			if (newCount >= priorityCount) {
				// 타임아웃 정리
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				// 약간의 지연을 두어 부드러운 전환
				setTimeout(() => {
					setShowPriorityImages(true);
				}, 50);
			}
			return newCount;
		});
	}, [priorityCount]);

	// 초기 마운트 시 모든 priority 이미지가 이미 로드되어 있는지 확인 (뒤로가기 등으로 캐시된 이미지 대응)
	useEffect(() => {
		if (showPriorityImages) return; // 이미 표시 중이면 체크 불필요

		let mounted = true;
		let checkedCount = 0;
		const priorityItems = items.slice(0, priorityCount);

		// 모든 priority 이미지의 로드 상태를 한 번에 확인
		const checkAllImages = () => {
			if (!mounted) return;

			priorityItems.forEach((item) => {
				if (!item.coverImageUrl) {
					checkedCount++;
					return;
				}

				const img = document.createElement('img');
				img.onload = () => {
					if (!mounted) return;
					checkedCount++;
					// 모든 이미지가 로드되었으면 즉시 표시
					if (checkedCount >= priorityItems.length) {
						setShowPriorityImages(true);
					}
				};
				img.onerror = () => {
					if (!mounted) return;
					checkedCount++;
					// 에러도 카운트에 포함 (에러도 로드 시도 완료로 간주)
					if (checkedCount >= priorityItems.length) {
						setShowPriorityImages(true);
					}
				};
				img.src = item.coverImageUrl;
			});

			// 이미지가 없는 경우 대비
			if (priorityItems.length === 0) {
				setShowPriorityImages(true);
			}
		};

		// 약간의 지연을 두어 DOM이 준비된 후 체크
		const checkTimeout = setTimeout(checkAllImages, 100);

		// 타임아웃: 일정 시간 후에도 모든 이미지가 로드되지 않으면 강제로 표시
		timeoutRef.current = setTimeout(() => {
			if (!showPriorityImages && mounted) {
				setShowPriorityImages(true);
			}
		}, 1500); // 1.5초 후 강제로 표시

		return () => {
			mounted = false;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			clearTimeout(checkTimeout);
		};
	}, [items, priorityCount, showPriorityImages]);

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{items.map((item, index) => {
				const isPriority = index < priorityCount;
				return (
					<PortfolioCard
						key={item.id}
						item={item}
						priority={isPriority}
						onPriorityLoad={isPriority ? handlePriorityLoad : undefined}
						showPriorityImages={showPriorityImages}
					/>
				);
			})}
			{items.length === 0 && (
				<div className="col-span-full rounded-lg border border-dashed p-10 text-center text-slate-500">
					표시할 포트폴리오가 없습니다.
				</div>
			)}
		</div>
	);
}

