"use client";

// 전역 에러 바운더리 (Notion API 등 오류 시)
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="mx-auto max-w-3xl px-4 py-24 text-center">
			<h2 className="text-2xl font-bold text-slate-900">문제가 발생했습니다.</h2>
			<p className="mt-2 text-slate-600">일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
			<button onClick={reset} className="mt-6 rounded-lg bg-blue-800 px-4 py-2 font-semibold text-white">다시 시도</button>
		</div>
	);
}

