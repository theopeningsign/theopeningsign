import PortfolioCard from '@/components/PortfolioCard';
import { getPortfolios } from '@/lib/notion';

export const revalidate = 60;

export default async function PortfolioPage() {
	const items = await getPortfolios();

	return (
		<div className="space-y-8">
			<div className="flex items-end justify-between">
				<h1 className="text-3xl font-extrabold text-slate-900">포트폴리오</h1>
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<PortfolioCard key={item.id} item={item} />
				))}
				{items.length === 0 && (
					<div className="col-span-full rounded-lg border border-dashed p-10 text-center text-slate-500">표시할 포트폴리오가 없습니다.</div>
				)}
			</div>
		</div>
	);
}

