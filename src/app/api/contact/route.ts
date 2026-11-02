import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { del, get, list } from '@vercel/blob';
import { buildPortfolioSlug } from '@/lib/notion';
import {
	ALLOWED_TYPES, ATTACH_PREFIX, MAIL_BATCH_BYTES, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES,
	fileExt, formatBytes, type AttachmentRef,
} from '@/lib/attachments';

// 첨부 원본을 Blob에서 받아 메일로 보내는 시간까지 여유를 둔다.
export const maxDuration = 120;

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'biz@ganpoom.com';
// Gmail SMTP(앱 비밀번호) 발신 계정. 메일은 이 계정으로 나가고 표시는 "더오프닝사인 상담신청".
const GMAIL_USER = process.env.GMAIL_USER || 'hyukjune.gp@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const FROM_EMAIL = `더오프닝사인 상담신청 <${GMAIL_USER}>`;
const SITE_URL = process.env.SITE_URL || 'https://theopeningsign.vercel.app';

function esc(v: unknown): string {
	return String(v ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

type WishItem = { id: string; title: string };
type MailFile = { filename: string; content: Buffer; contentType: string; size: number; pathname: string };

// 첨부 경로는 업로드 라우트가 허용한 형식(contact/날짜/난수-접미사.확장자)만 받는다.
const ATTACH_PATH_RE = new RegExp(`^${ATTACH_PREFIX}\\d{8}/[A-Za-z0-9-]+\\.[a-z0-9]+$`);

function safeFilename(name: unknown, pathname: string): string {
	const ext = fileExt(pathname);
	const base = String(name ?? '').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim().slice(0, 120);
	if (!base) return `첨부.${ext}`;
	return fileExt(base) === ext ? base : `${base}.${ext}`;
}

async function loadAttachments(refs: AttachmentRef[]): Promise<MailFile[] | string> {
	if (refs.length > MAX_FILES) return `첨부파일은 최대 ${MAX_FILES}개까지 보낼 수 있습니다.`;
	const files: MailFile[] = [];
	let total = 0;
	for (const ref of refs) {
		const pathname = String(ref?.pathname ?? '');
		if (!ATTACH_PATH_RE.test(pathname) || !ALLOWED_TYPES[fileExt(pathname)]) return '첨부파일 정보가 올바르지 않습니다.';
		const res = await get(pathname, { access: 'private', useCache: false });
		if (!res || res.statusCode !== 200) return '첨부파일을 찾지 못했습니다. 다시 첨부해주세요.';
		if (res.blob.size > MAX_FILE_BYTES) return `파일 하나는 ${formatBytes(MAX_FILE_BYTES)}까지 첨부할 수 있습니다.`;
		total += res.blob.size;
		if (total > MAX_TOTAL_BYTES) return '첨부파일 합계가 너무 큽니다.';
		const content = Buffer.from(await new Response(res.stream).arrayBuffer());
		files.push({
			filename: safeFilename(ref.name, pathname),
			content,
			contentType: ALLOWED_TYPES[fileExt(pathname)],
			size: content.length,
			pathname,
		});
	}
	return files;
}

// 메일 1통 첨부 합계가 MAIL_BATCH_BYTES를 넘지 않도록 나눈다.
function batchFiles(files: MailFile[]): MailFile[][] {
	const batches: MailFile[][] = [];
	let cur: MailFile[] = [];
	let curSize = 0;
	for (const f of files) {
		if (cur.length && curSize + f.size > MAIL_BATCH_BYTES) {
			batches.push(cur);
			cur = [];
			curSize = 0;
		}
		cur.push(f);
		curSize += f.size;
	}
	if (cur.length) batches.push(cur);
	return batches;
}

// 업로드만 하고 신청하지 않은 파일(하루 지난 것)을 정리한다. 실패해도 신청 처리는 계속한다.
async function cleanupOrphans() {
	try {
		const cutoff = Date.now() - 24 * 60 * 60 * 1000;
		const { blobs } = await list({ prefix: ATTACH_PREFIX, limit: 1000 });
		const old = blobs.filter((b) => new Date(b.uploadedAt).getTime() < cutoff).map((b) => b.pathname);
		if (old.length) await del(old);
	} catch (e) {
		console.error('[contact] 오래된 첨부 정리 실패', e);
	}
}

export async function POST(req: NextRequest) {
	if (!GMAIL_APP_PASSWORD) {
		return NextResponse.json({ error: '메일 설정이 완료되지 않았습니다. (GMAIL_APP_PASSWORD 없음)' }, { status: 500 });
	}

	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
	}

	// 허니팟: 봇이 채우면 조용히 성공 처리(실제 발송 안 함)
	if (body.company_website) return NextResponse.json({ ok: true });

	// 필수 검증 (병원명은 선택)
	const requiredFields = ['department', 'name', 'phone', 'address', 'openStatus'];
	for (const f of requiredFields) {
		if (!body[f]) return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
	}
	if (!body.agree) return NextResponse.json({ error: '개인정보 수집·이용 동의가 필요합니다.' }, { status: 400 });

	const refs: AttachmentRef[] = Array.isArray(body.attachments) ? (body.attachments as AttachmentRef[]) : [];
	let files: MailFile[] = [];
	if (refs.length) {
		try {
			const loaded = await loadAttachments(refs);
			if (typeof loaded === 'string') return NextResponse.json({ error: loaded }, { status: 400 });
			files = loaded;
		} catch (e) {
			console.error('[contact] 첨부 불러오기 실패', e);
			return NextResponse.json({ error: '첨부파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 });
		}
	}
	const batches = batchFiles(files);

	const openStatus = body.openStatus === 'before' ? '개원 전' : '영업 중';

	const wishlist: WishItem[] = Array.isArray(body.wishlist) ? (body.wishlist as WishItem[]) : [];
	const wishHtml = wishlist.length
		? `<ul style="margin:0;padding-left:18px">${wishlist
			.map((w) => `<li><a href="${SITE_URL}/portfolio/${encodeURIComponent(buildPortfolioSlug(w.title, w.id))}">${esc(w.title)}</a></li>`)
			.join('')}</ul>`
		: '<span style="color:#888">없음</span>';

	const rows: [string, string][] = [
		['병원명', esc(body.clinic) || '<span style="color:#888">미정</span>'],
		['진료과목', esc(body.department)],
		['담당자', esc(body.name)],
		['연락처', esc(body.phone)],
		['주소', esc(body.address)],
		['개원 여부', openStatus],
		['요청사항', esc(body.request) || '<span style="color:#888">없음</span>'],
		['참고 포트폴리오', wishHtml],
		['첨부파일', files.length
			? `<ul style="margin:0;padding-left:18px">${files.map((f) => `<li>${esc(f.filename)} (${formatBytes(f.size)})</li>`).join('')}</ul>`
				+ (batches.length > 1 ? `<p style="margin:6px 0 0;color:#64748b;font-size:12px">용량이 커서 메일 ${batches.length}통으로 나눠 보냈습니다.</p>` : '')
			: '<span style="color:#888">없음</span>'],
	];

	const html = `
	<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
		<h2 style="color:#ED6A26;margin:0 0 4px">새 상담신청</h2>
		<p style="margin:0 0 16px;color:#64748b;font-size:13px">${esc(body.clinic)} · ${esc(body.name)} 님</p>
		<table style="width:100%;border-collapse:collapse;font-size:14px">
			${rows.map(([k, v]) => `
				<tr>
					<td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap;vertical-align:top;width:120px">${k}</td>
					<td style="padding:10px 12px;border:1px solid #e2e8f0;vertical-align:top">${v}</td>
				</tr>`).join('')}
		</table>
	</div>`;

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
	});
	const subject = `[상담신청] ${esc(body.clinic) || esc(body.department)} / ${esc(body.name)}`;
	const toMailAttachments = (batch: MailFile[] = []) =>
		batch.map((f) => ({ filename: f.filename, content: f.content, contentType: f.contentType }));
	try {
		await transporter.sendMail({
			from: FROM_EMAIL,
			to: TO_EMAIL,
			replyTo: typeof body.email === 'string' && body.email ? body.email : undefined,
			subject: batches.length > 1 ? `${subject} (첨부 1/${batches.length})` : subject,
			html,
			attachments: toMailAttachments(batches[0]),
		});
		// 나머지 첨부는 같은 제목에 번호를 붙여 이어서 보낸다.
		for (let i = 1; i < batches.length; i++) {
			await transporter.sendMail({
				from: FROM_EMAIL,
				to: TO_EMAIL,
				subject: `${subject} (첨부 ${i + 1}/${batches.length})`,
				html: `<p style="font-family:sans-serif;color:#1e293b">${esc(body.clinic) || esc(body.department)} · ${esc(body.name)} 님 상담신청의 첨부파일 ${i + 1}/${batches.length}입니다.</p>`,
				attachments: toMailAttachments(batches[i]),
			});
		}
		// 메일에 원본이 들어갔으니 Blob에서는 지운다. 오래된 미사용 파일도 함께 정리.
		if (files.length) {
			await del(files.map((f) => f.pathname)).catch((e) => console.error('[contact] 첨부 삭제 실패', e));
		}
		if (process.env.BLOB_READ_WRITE_TOKEN) await cleanupOrphans();
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error('[contact] 발송 예외', e);
		return NextResponse.json({ error: '메일 발송 중 오류가 발생했습니다.' }, { status: 502 });
	}
}
