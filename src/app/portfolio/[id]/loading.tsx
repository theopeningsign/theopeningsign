export default function Loading() {
	return (
		<div className="space-y-6">
			<div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
			<div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
			<div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
			<div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200" />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="h-40 animate-pulse rounded-lg bg-slate-200" />
				))}
			</div>
		</div>
	);
}


