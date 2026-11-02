"use client";

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { upload } from '@vercel/blob/client';
import { useWishlist } from '@/hooks/useWishlist';
import { removeWishlist, clearWishlist } from '@/lib/wishlist';
import {
	ACCEPT_ATTR, ALLOWED_TYPES, ATTACH_PREFIX, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES,
	fileExt, formatBytes, type AttachmentRef,
} from '@/lib/attachments';

type FormValues = {
	clinic?: string;         // 병원명 (선택 — 개원 전 미정일 수 있음)
	department: string;      // 진료과목 (필수)
	name: string;            // 담당자 성함 (필수)
	phone: string;           // 연락처 (필수)
	address: string;         // 주소 (필수, 간략)
	openStatus: string;      // 개원여부 (필수)
	request?: string;        // 요청사항 (선택)
	agree: boolean;          // 개인정보 동의 (필수)
	company_website?: string;// 허니팟
};

const OPEN_STATUS = [
	{ value: 'before', label: '개원 전' },
	{ value: 'operating', label: '영업 중' },
];

const inputClass =
	'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ED6A26] focus:ring-2 focus:ring-orange-200';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
const req = <span className="text-[#ED6A26]">*</span>;
const pillClass =
	'inline-block cursor-pointer rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 peer-checked:border-[#ED6A26] peer-checked:bg-orange-50 peer-checked:font-semibold peer-checked:text-[#ED6A26]';

export default function ConsultationForm() {
	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();
	const wishlist = useWishlist();
	const [submitted, setSubmitted] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState('');
	const [progress, setProgress] = useState('');
	const fileInput = useRef<HTMLInputElement>(null);

	function addFiles(list: FileList | null) {
		if (!list) return;
		const next = [...files];
		const rejected: string[] = [];
		for (const f of Array.from(list)) {
			if (!ALLOWED_TYPES[fileExt(f.name)]) rejected.push(`${f.name}: 사진(jpg·png·heic 등)과 PDF만 첨부할 수 있어요.`);
			else if (f.size > MAX_FILE_BYTES) rejected.push(`${f.name}: 파일 하나는 ${formatBytes(MAX_FILE_BYTES)}까지 첨부할 수 있어요.`);
			else if (next.length >= MAX_FILES) rejected.push(`첨부파일은 최대 ${MAX_FILES}개까지예요.`);
			else if (next.reduce((n, x) => n + x.size, 0) + f.size > MAX_TOTAL_BYTES) rejected.push(`첨부파일 합계는 ${formatBytes(MAX_TOTAL_BYTES)}까지예요.`);
			else next.push(f);
		}
		setFiles(next);
		setFileError([...new Set(rejected)].join('\n'));
		if (fileInput.current) fileInput.current.value = '';
	}

	// 원본 그대로 Blob(비공개)에 직접 올린다. 서버 용량 제한(4.5MB)을 거치지 않는다.
	async function uploadFiles(): Promise<AttachmentRef[]> {
		const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const refs: AttachmentRef[] = [];
		for (let i = 0; i < files.length; i++) {
			const f = files[i];
			const ext = fileExt(f.name);
			const id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).toLowerCase();
			const blob = await upload(`${ATTACH_PREFIX}${day}/${id}.${ext}`, f, {
				access: 'private',
				handleUploadUrl: '/api/contact/upload',
				contentType: ALLOWED_TYPES[ext],
				multipart: f.size > 8 * 1024 * 1024,
				onUploadProgress: ({ percentage }) => setProgress(`첨부파일 올리는 중 ${i + 1}/${files.length} (${Math.round(percentage)}%)`),
			});
			refs.push({ pathname: blob.pathname, name: f.name });
		}
		return refs;
	}

	async function onSubmit(data: FormValues) {
		if (data.company_website) return; // 허니팟
		let attachments: AttachmentRef[] = [];
		if (files.length) {
			try {
				attachments = await uploadFiles();
			} catch (e) {
				console.error(e);
				setProgress('');
				alert('첨부파일을 올리지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
				return;
			}
		}
		setProgress(files.length ? '상담신청을 보내는 중…' : '');
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...data, wishlist, attachments }),
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				alert(j.error || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
				return;
			}
			setSubmitted(true);
			reset();
			clearWishlist();
			setFiles([]);
		} catch {
			alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
		} finally {
			setProgress('');
		}
	}

	if (submitted) {
		return (
			<div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-10 text-center">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ED6A26] text-2xl text-white">✓</div>
				<h2 className="text-xl font-bold text-slate-900">상담신청이 접수되었습니다</h2>
				<p className="mt-2 text-slate-600">빠른 시일 내에 연락드리겠습니다.<br />감사합니다.</p>
				<button
					type="button"
					onClick={() => setSubmitted(false)}
					className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					다시 작성하기
				</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* 참고 포트폴리오 (담은 목록) */}
			<div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
				<p className="mb-2 text-sm font-semibold text-slate-800">참고 포트폴리오</p>
				{wishlist.length === 0 ? (
					<p className="text-sm text-slate-500">
						아직 담은 포트폴리오가 없습니다. 포트폴리오에서 마음에 드는 사례를 <span className="text-[#ED6A26]">♡담기</span> 하면 여기에 표시돼요.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{wishlist.map((w) => (
							<span key={w.id} className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800">
								{w.title}
								<button type="button" onClick={() => removeWishlist(w.id)} className="hover:text-orange-900" aria-label="제거">✕</button>
							</span>
						))}
					</div>
				)}
			</div>

			{/* 기본 정보 */}
			<div className="grid gap-5 sm:grid-cols-2">
				<div>
					<label className={labelClass}>병원명 <span className="text-slate-400">(선택)</span></label>
					<input className={inputClass} placeholder="예) 더오프닝의원 (미정 시 비워두세요)" {...register('clinic')} />
				</div>
				<div>
					<label className={labelClass}>진료과목 {req}</label>
					<input className={inputClass} placeholder="예) 피부과 / 정형외과 / 한의원" {...register('department', { required: '진료과목을 입력해주세요.' })} />
					{errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
				</div>
				<div>
					<label className={labelClass}>담당자 성함 {req}</label>
					<input className={inputClass} placeholder="예) 홍길동" {...register('name', { required: '담당자 성함을 입력해주세요.' })} />
					{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
				</div>
				<div>
					<label className={labelClass}>연락처 {req}</label>
					<input className={inputClass} placeholder="010-0000-0000" inputMode="tel" {...register('phone', { required: '연락처를 입력해주세요.' })} />
					{errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
				</div>
				<div className="sm:col-span-2">
					<label className={labelClass}>주소 {req}</label>
					<input className={inputClass} placeholder="예) 서울 송파구" {...register('address', { required: '주소(지역)를 입력해주세요.' })} />
					{errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
				</div>
			</div>

			{/* 개원 여부 */}
			<div>
				<label className={labelClass}>개원 여부 {req}</label>
				<div className="flex flex-wrap gap-2">
					{OPEN_STATUS.map((o) => (
						<label key={o.value}>
							<input type="radio" value={o.value} className="peer sr-only" {...register('openStatus', { required: '개원 여부를 선택해주세요.' })} />
							<span className={pillClass}>{o.label}</span>
						</label>
					))}
				</div>
				{errors.openStatus && <p className="mt-1 text-sm text-red-600">{errors.openStatus.message}</p>}
			</div>

			{/* 요청사항 (선택) */}
			<div>
				<label className={labelClass}>요청사항 <span className="text-slate-400">(선택)</span></label>
				<textarea rows={4} className={inputClass} placeholder="원하시는 간판 느낌, 예산, 일정 등 자유롭게 적어주세요." {...register('request')} />
			</div>

			{/* 첨부파일 (선택) */}
			<div>
				<label className={labelClass}>첨부파일 <span className="text-slate-400">(선택)</span></label>
				<p className="mb-2 text-xs text-slate-500 break-keep">
					현장 사진, 원하는 간판 참고 이미지, 도면 등을 원본 그대로 보내주세요. 사진·PDF, 파일당 {formatBytes(MAX_FILE_BYTES)}, 최대 {MAX_FILES}개.
				</p>
				<input
					ref={fileInput}
					type="file"
					multiple
					accept={ACCEPT_ATTR}
					className="hidden"
					onChange={(e) => addFiles(e.target.files)}
				/>
				<button
					type="button"
					onClick={() => fileInput.current?.click()}
					disabled={isSubmitting}
					className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:border-[#ED6A26] hover:text-[#ED6A26] disabled:opacity-60"
				>
					+ 파일 선택
				</button>
				{files.length > 0 && (
					<ul className="mt-3 space-y-1.5">
						{files.map((f, i) => (
							<li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
								<span className="min-w-0 truncate">{f.name}</span>
								<span className="flex shrink-0 items-center gap-3 text-slate-400">
									{formatBytes(f.size)}
									<button
										type="button"
										onClick={() => setFiles(files.filter((_, j) => j !== i))}
										disabled={isSubmitting}
										className="hover:text-red-600"
										aria-label={`${f.name} 삭제`}
									>
										✕
									</button>
								</span>
							</li>
						))}
					</ul>
				)}
				{fileError && <p className="mt-2 whitespace-pre-line text-sm text-red-600">{fileError}</p>}
			</div>

			{/* 허니팟 */}
			<input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register('company_website')} />

			{/* 개인정보 동의 */}
			<div>
				<label className="flex items-start gap-2.5 text-sm text-slate-600">
					<input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#ED6A26] focus:ring-orange-300" {...register('agree', { required: '개인정보 수집·이용에 동의해주세요.' })} />
					<span>개인정보 수집·이용에 동의합니다. {req}</span>
				</label>
				<p className="mt-1 pl-7 text-xs text-slate-400">
					상담 목적으로만 사용됩니다.{' '}
					<a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#ED6A26]">개인정보처리방침 보기</a>
				</p>
				{errors.agree && <p className="mt-1 text-sm text-red-600">{errors.agree.message}</p>}
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full rounded-lg bg-[#D45720] px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#ED6A26] disabled:opacity-60"
			>
				{isSubmitting ? (progress || '보내는 중…') : '상담 신청하기'}
			</button>
		</form>
	);
}
