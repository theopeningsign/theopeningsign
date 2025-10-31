export default function Loading() {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="overflow-hidden rounded-xl border border-slate-200">
					<div className="h-40 animate-pulse bg-slate-200" />
					<div className="space-y-2 p-4">
						<div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
						<div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
					</div>
				</div>
			))}
		</div>
	);
}


