import PortfolioCard from '@/components/PortfolioCard';
import { getPortfolios } from '@/lib/notion';

export const revalidate = 300; // 5분 캐시 (첫 방문 후 매우 빠름)

export default async function PortfolioPage() {
	const items = await getPortfolios();

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{items.map((item, index) => (
					<PortfolioCard 
						key={item.id} 
						item={item} 
						priority={index < 6} // 첫 6개만 priority (첫 화면에 보이는 이미지)
					/>
				))}
				{items.length === 0 && (
					<div className="col-span-full rounded-lg border border-dashed p-10 text-center text-slate-500">표시할 포트폴리오가 없습니다.</div>
				)}
			</div>
		</div>
	);
}

