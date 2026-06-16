"use client";

import { useState, useEffect } from 'react';
import PortfolioCard from './PortfolioCard';
import { PortfolioItem } from '@/lib/types';

interface Props {
	items: PortfolioItem[];
	priorityCount?: number; // priority 이미지 개수 (기본값: 12, PC 기준)
	currentPage?: number;
}

export default function PortfolioGrid({ items, priorityCount = 12, currentPage = 1 }: Props) {
	const [actualPriorityCount, setActualPriorityCount] = useState(priorityCount);

	// 화면 크기에 따라 priority 개수 조정 (모바일 최적화)
	useEffect(() => {
		const updatePriorityCount = () => {
			if (typeof window === 'undefined') return;
			const width = window.innerWidth;
			if (width < 768) {
				setActualPriorityCount(3); // 모바일
			} else if (width < 1024) {
				setActualPriorityCount(6); // 태블릿
			} else {
				setActualPriorityCount(priorityCount); // PC
			}
		};

		updatePriorityCount();
		window.addEventListener('resize', updatePriorityCount);
		return () => window.removeEventListener('resize', updatePriorityCount);
	}, [priorityCount]);

	return (
		<div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
				{items.map((item, index) => (
					<PortfolioCard
						key={item.id}
						item={item}
						priority={index < actualPriorityCount}
						currentPage={currentPage}
					/>
				))}
				{items.length === 0 && (
					<div className="col-span-full rounded-lg border border-dashed p-10 text-center text-slate-500">
						표시할 포트폴리오가 없습니다.
					</div>
				)}
			</div>
		</div>
	);
}
