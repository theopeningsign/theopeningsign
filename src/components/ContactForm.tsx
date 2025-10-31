// 문의 폼 (React Hook Form 사용)
"use client";

import { useForm } from 'react-hook-form';

type FormValues = {
	name: string;
	contact: string;
	message: string;
};

export default function ContactForm() {
	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

	async function onSubmit(data: FormValues) {
		// 실제 전송 로직은 추후 백엔드 연동 필요
		alert(`문의가 접수되었습니다.\n이름: ${data.name}\n연락처: ${data.contact}`);
		reset();
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label className="mb-1 block text-sm font-medium text-slate-700">이름</label>
				<input
					type="text"
					className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
					placeholder="홍길동"
					{...register('name', { required: '이름을 입력해주세요.' })}
				/>
				{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
			</div>
			<div>
				<label className="mb-1 block text-sm font-medium text-slate-700">연락처</label>
				<input
					type="text"
					className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
					placeholder="010-0000-0000 또는 이메일"
					{...register('contact', { required: '연락처를 입력해주세요.' })}
				/>
				{errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact.message}</p>}
			</div>
			<div>
				<label className="mb-1 block text-sm font-medium text-slate-700">내용</label>
				<textarea
					rows={5}
					className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
					placeholder="문의하실 내용을 입력해주세요."
					{...register('message', { required: '문의 내용을 입력해주세요.' })}
				/>
				{errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
			</div>
			<button
				type="submit"
				disabled={isSubmitting}
				className="inline-flex items-center justify-center rounded-lg bg-blue-800 px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
			>
				제출
			</button>
		</form>
	);
}


