import PortfolioCard from '@/components/PortfolioCard';
import { getPortfolios } from '@/lib/notion';
import type { Metadata } from 'next';

export const revalidate = 60; // 1분 캐시 (정상 로드 시 빠름, 이미지 실패 시 자동 새로고침)

export const metadata: Metadata = {
  title: "포트폴리오 | 더오프닝사인 THE OPENING SIGN",
  description: "더오프닝사인 THE OPENING SIGN의 병원 간판 시공 포트폴리오를 확인하세요. LED채널, 아크릴, 네온, 복합 간판 등 다양한 병원 간판 제작 사례를 만나보세요.",
  keywords: ["더오프닝사인", "THE OPENING SIGN", "병원 간판 포트폴리오", "병원 간판 시공 사례", "LED채널 간판", "아크릴 간판", "네온 간판"],
};

export default async function PortfolioPage() {
	const items = await getPortfolios();

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{items.map((item, index) => (
					<PortfolioCard 
						key={item.id} 
						item={item} 
						priority={index < 12} // 첫 12개 priority
					/>
				))}
				{items.length === 0 && (
					<div className="col-span-full rounded-lg border border-dashed p-10 text-center text-slate-500">표시할 포트폴리오가 없습니다.</div>
				)}
			</div>
		</div>
	);
}

