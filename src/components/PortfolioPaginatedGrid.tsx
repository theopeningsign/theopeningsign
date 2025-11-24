"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PortfolioGrid from '@/components/PortfolioGrid';
import type { PortfolioItem } from '@/lib/types';

interface Props {
	items: PortfolioItem[];
}

const STORAGE_KEY = 'portfolioCurrentPage';

const getItemsPerPage = (width?: number) => {
	if (typeof width !== 'number') return 9;
	if (width < 768) return 6; // 모바일
	if (width < 1280) return 6; // 2열 레이아웃 구간
	return 9; // 충분히 넓은 화면에서만 3x3
};

export default function PortfolioPaginatedGrid({ items }: Props) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [itemsPerPage, setItemsPerPage] = useState(9);
	const [currentPage, setCurrentPage] = useState(1);
	const hasRestoredPage = useRef(false);

	// 화면 크기에 따라 페이지당 아이템 수 결정
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const updateItemsPerPage = () => {
			const next = getItemsPerPage(window.innerWidth);
			setItemsPerPage((prev) => (prev === next ? prev : next));
		};

		updateItemsPerPage();
		window.addEventListener('resize', updateItemsPerPage);
		return () => window.removeEventListener('resize', updateItemsPerPage);
	}, []);

	// 페이지당 개수가 바뀌면 첫 페이지로 이동
	useEffect(() => {
		setCurrentPage(1);
		hasRestoredPage.current = false;
	}, [itemsPerPage, items.length]);

	const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

	// 현재 페이지가 총 페이지 수를 넘지 않도록 보정
	useEffect(() => {
		setCurrentPage((prev) => Math.min(prev, totalPages));
	}, [totalPages]);

	// URL 혹은 sessionStorage로부터 페이지 복원
	useEffect(() => {
		if (typeof window === 'undefined' || hasRestoredPage.current) return;
		const paramPage = Number.parseInt(searchParams.get('page') || '', 10);
		const stored = Number.isFinite(paramPage)
			? paramPage
			: Number.parseInt(sessionStorage.getItem(STORAGE_KEY) || '', 10);
		if (Number.isFinite(stored)) {
			setCurrentPage(() => {
				if (stored < 1) return 1;
				if (stored > totalPages) return totalPages;
				return stored;
			});
		}
		hasRestoredPage.current = true;
	}, [totalPages, searchParams]);

	// 현재 페이지 저장 (복원 완료 후에만)
	useEffect(() => {
		if (typeof window === 'undefined' || !hasRestoredPage.current) return;
		sessionStorage.setItem(STORAGE_KEY, currentPage.toString());
	}, [currentPage]);

	const currentItems = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return items.slice(start, start + itemsPerPage);
	}, [items, currentPage, itemsPerPage]);

	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages || page === currentPage) return;
		setCurrentPage(page);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		router.replace(page === 1 ? '?' : `?page=${page}`, { scroll: false });
	};

	const pageNumbers = useMemo(() => {
		const maxButtons = 5;
		const pages: number[] = [];
		let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
		let end = Math.min(totalPages, start + maxButtons - 1);
		start = Math.max(1, end - maxButtons + 1);

		for (let i = start; i <= end; i += 1) {
			pages.push(i);
		}
		return pages;
	}, [currentPage, totalPages]);

	return (
		<div className="space-y-8">
			<PortfolioGrid
				items={currentItems}
				priorityCount={Math.min(itemsPerPage, 12)}
				currentPage={currentPage}
			/>

			{totalPages > 1 && (
				<div className="flex flex-wrap items-center justify-center gap-2">
					<button
						type="button"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-orange-300 hover:text-orange-500"
					>
						이전
					</button>

					{pageNumbers.map((page) => (
						<button
							key={page}
							type="button"
							onClick={() => handlePageChange(page)}
							className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
								page === currentPage
									? 'bg-orange-500 text-white shadow'
									: 'border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500'
							}`}
						>
							{page}
						</button>
					))}

					<button
						type="button"
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-orange-300 hover:text-orange-500"
					>
						다음
					</button>
				</div>
			)}
		</div>
	);
}


