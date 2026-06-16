import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: '개인정보처리방침 | 더오프닝사인 THE OPENING SIGN',
	description: '더오프닝사인 THE OPENING SIGN 개인정보처리방침',
};

export default function PrivacyPage() {
	return (
		<div className="mx-auto max-w-3xl">
			<h1 className="text-3xl font-extrabold text-slate-900">개인정보처리방침</h1>
			<p className="mt-3 text-slate-600">
				더오프닝사인(THE OPENING SIGN, 이하 &lsquo;회사&rsquo;)은 이용자의 개인정보를 중요하게 생각하며,
				「개인정보 보호법」 등 관련 법령을 준수합니다. 회사는 상담신청 과정에서 수집하는 개인정보를 다음과 같이 처리합니다.
			</p>

			<div className="prose prose-slate mt-8 max-w-none text-slate-700">
				<section className="space-y-2">
					<h2 className="text-lg font-bold text-slate-900">1. 수집하는 개인정보 항목</h2>
					<ul className="list-disc space-y-1 pl-5">
						<li><b>필수</b>: 담당자 성함, 연락처, 설치 주소</li>
						<li><b>선택</b>: 이메일</li>
						<li><b>상담 관련 정보</b>: 병원/상호명, 간판 종류, 철거 여부, 설치 층수, 개원 여부 및 희망 일정, 요청사항, 참고 포트폴리오</li>
					</ul>
				</section>

				<section className="mt-6 space-y-2">
					<h2 className="text-lg font-bold text-slate-900">2. 개인정보의 수집·이용 목적</h2>
					<ul className="list-disc space-y-1 pl-5">
						<li>간판 시공 상담 및 견적 안내</li>
						<li>문의사항에 대한 응대 및 연락</li>
					</ul>
				</section>

				<section className="mt-6 space-y-2">
					<h2 className="text-lg font-bold text-slate-900">3. 보유 및 이용 기간</h2>
					<p>
						수집된 개인정보는 <b>수집일로부터 1년</b> 또는 <b>상담 종료 시</b>까지 보유·이용하며,
						목적 달성 후에는 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
						이용자가 삭제를 요청하는 경우 즉시 파기합니다.
					</p>
				</section>

				<section className="mt-6 space-y-2">
					<h2 className="text-lg font-bold text-slate-900">4. 개인정보 처리의 위탁</h2>
					<p>회사는 상담 메일 발송을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
					<ul className="list-disc space-y-1 pl-5">
						<li>수탁업체: Resend (이메일 발송 서비스)</li>
						<li>위탁업무: 상담신청 내용의 메일 전송</li>
					</ul>
				</section>

				<section className="mt-6 space-y-2">
					<h2 className="text-lg font-bold text-slate-900">5. 개인정보의 제3자 제공</h2>
					<p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 의해 요구되는 경우는 예외로 합니다.</p>
				</section>

				<section className="mt-6 space-y-2">
					<h2 className="text-lg font-bold text-slate-900">6. 동의 거부 권리 및 불이익</h2>
					<p>
						이용자는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
						다만 필수 항목에 대한 동의를 거부하실 경우 상담신청이 제한될 수 있습니다.
					</p>
				</section>

				<section className="mt-6 space-y-2">
					<h2 className="text-lg font-bold text-slate-900">7. 개인정보 보호책임자 및 문의처</h2>
					<ul className="list-disc space-y-1 pl-5">
						<li>상호: 더오프닝사인 (THE OPENING SIGN)</li>
						<li>연락처: 010-2366-5876</li>
						<li>이메일: theopensign@gmail.com</li>
						<li>주소: 서울 강서구 공항대로 659 도레미빌딩 7층</li>
					</ul>
				</section>

				<p className="mt-8 text-sm text-slate-500">본 방침은 2026년 6월 10일부터 시행됩니다.</p>
			</div>
		</div>
	);
}
