import type { Metadata } from 'next';
import ConsultationForm from '@/components/ConsultationForm';
import ScrollTopOnMount from '@/components/ScrollTopOnMount';

export const metadata: Metadata = {
	title: '상담신청 | 더오프닝사인 THE OPENING SIGN',
	description: '병원 간판 시공 상담을 신청하세요. 원하시는 포트폴리오를 참고해 맞춤 상담을 도와드립니다.',
};

export default function ContactPage() {
	return (
		<div className="mx-auto max-w-2xl">
			<ScrollTopOnMount />
			{/* 헤더 */}
			<div className="text-center">
				<h1 className="text-3xl font-extrabold text-slate-900">상담신청</h1>
				<p className="mt-3 text-slate-600 break-keep">
					원하시는 간판 느낌을 포트폴리오에서 참고해 알려주시면, 더 정확하게 상담해드립니다.
				</p>
			</div>

			{/* 상담 폼 */}
			<div className="mt-8">
				<ConsultationForm />
			</div>
		</div>
	);
}
