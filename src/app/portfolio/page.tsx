import PortfolioGrid from '@/components/PortfolioGrid';
import { getPortfolios } from '@/lib/notion';
import type { Metadata } from 'next';

export const revalidate = 60; // 1분 캐시 (정상 로드 시 빠름, 이미지 실패 시 자동 새로고침)

export const metadata: Metadata = {
  title: "포트폴리오 | 더오프닝사인 THE OPENING SIGN",
  description: "더오프닝사인 THE OPENING SIGN의 병원 간판 시공 포트폴리오를 확인하세요. 다양한 병원 간판 제작 사례를 만나보세요.",
  keywords: ["더오프닝사인", "THE OPENING SIGN", "병원 간판 포트폴리오", "병원 간판 시공 사례"],
};

export default async function PortfolioPage() {
	const items = await getPortfolios();

	return (
		<div className="space-y-8">
			<PortfolioGrid items={items} priorityCount={12} />
		</div>
	);
}

