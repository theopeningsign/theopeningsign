// 하단 푸터
export default function Footer() {
	return (
		<footer className="border-t border-slate-200/60" style={{ backgroundColor: '#FFF9F5' }}>
			<div className="mx-auto max-w-6xl px-4 py-8 text-sm" style={{ color: '#C24F1E' }}>
				<p>© {new Date().getFullYear()} THE OPENING SIGN. All rights reserved.</p>
			</div>
		</footer>
	);
}


