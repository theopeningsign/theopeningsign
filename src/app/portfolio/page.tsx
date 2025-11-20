import PortfolioCard from '@/components/PortfolioCard';
import { getPortfolios } from '@/lib/notion';

export const revalidate = 60; // 1분 캐시 (정상 로드 시 빠름, 이미지 실패 시 자동 새로고침)

export default async function PortfolioPage() {
	const items = await getPortfolios();

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{items.map((item, index) => (
					<PortfolioCard 
						key={item.id} 
						item={item} 
						priority={index < 15} // 첫 15개 priority (더 많은 이미지 미리 로드)
					/>
				))}
				{items.length === 0 && (
					<div className="col-span-full rounded-lg border border-dashed p-10 text-center text-slate-500">표시할 포트폴리오가 없습니다.</div>
				)}
			</div>
		</div>
	);
}

