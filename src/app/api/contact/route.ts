import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { del, get, list } from '@vercel/blob';
import { buildPortfolioSlug } from '@/lib/notion';
import {
	ALLOWED_TYPES, ATTACH_PREFIX, MAIL_BATCH_BYTES, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES,
	fileExt, formatBytes, type AttachmentRef,
} from '@/lib/attachments';

// 첨부 원본을 Blob에서 받아 메일로 보내는 시간까지 여유를 둔다.
export const maxDuration = 300;

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
	if (!ext) return base || '첨부';
	if (!base) return `첨부.${ext}`;
	return fileExt(base) === ext ? base : `${base}.${ext}`;
}

type FailedFile = { name: string; reason: string };

// 첨부는 파일별로 따로 시도한다. 하나가 실패해도 나머지와 상담신청 메일은 계속 진행.
// 전체 불러오기에 시간 상한을 둬서, 첨부 때문에 상담신청 메일이 시간 초과로 못 나가는 일을 막는다.
async function loadAttachments(refs: AttachmentRef[]): Promise<{ files: MailFile[]; failed: FailedFile[] }> {
	const files: MailFile[] = [];
	const failed: FailedFile[] = [];
	const deadline = Date.now() + 60 * 1000;
	let total = 0;
	for (const [i, ref] of refs.entries()) {
		const pathname = String(ref?.pathname ?? '');
		const name = safeFilename(ref?.name, pathname);
		if (i >= MAX_FILES) { failed.push({ name, reason: `최대 ${MAX_FILES}개 초과` }); continue; }
		if (!ATTACH_PATH_RE.test(pathname) || !ALLOWED_TYPES[fileExt(pathname)]) { failed.push({ name, reason: '잘못된 파일 정보' }); continue; }
		const remaining = deadline - Date.now();
		if (remaining <= 0) { failed.push({ name, reason: '불러오기 시간 초과' }); continue; }
		try {
			const res = await get(pathname, { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(Math.min(remaining, 30 * 1000)) });
			if (!res || res.statusCode !== 200) { failed.push({ name, reason: '저장소에서 파일을 찾지 못함' }); continue; }
			if (res.blob.size > MAX_FILE_BYTES) { failed.push({ name, reason: `${formatBytes(MAX_FILE_BYTES)} 초과` }); continue; }
			if (total + res.blob.size > MAX_TOTAL_BYTES) { failed.push({ name, reason: '합계 용량 초과' }); continue; }
			const content = Buffer.from(await new Response(res.stream).arrayBuffer());
			total += content.length;
			files.push({ filename: name, content, contentType: ALLOWED_TYPES[fileExt(pathname)], size: content.length, pathname });
		} catch (e) {
			console.error('[contact] 첨부 불러오기 실패', pathname, e);
			failed.push({ name, reason: '저장소에서 불러오기 실패' });
		}
	}
	return { files, failed };
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

	// 첨부 처리는 어떤 경우에도 상담신청 메일 발송을 막지 않는다.
	const refs: AttachmentRef[] = Array.isArray(body.attachments) ? (body.attachments as AttachmentRef[]) : [];
	// 브라우저에서 업로드부터 실패한 파일 이름
	const clientFailed: FailedFile[] = (Array.isArray(body.attachmentErrors) ? body.attachmentErrors : [])
		.slice(0, MAX_FILES * 2)
		.map((n) => ({ name: safeFilename(n, 'x.' + fileExt(String(n ?? ''))), reason: '고객 화면에서 업로드 실패' }));
	let files: MailFile[] = [];
	let failed: FailedFile[] = [...clientFailed];
	if (refs.length) {
		const loaded = await loadAttachments(refs.slice(0, MAX_FILES * 2));
		files = loaded.files;
		failed = failed.concat(loaded.failed);
	}

	const openStatus = body.openStatus === 'before' ? '개원 전' : '영업 중';

	const wishlist: WishItem[] = Array.isArray(body.wishlist) ? (body.wishlist as WishItem[]) : [];
	const wishHtml = wishlist.length
		? `<ul style="margin:0;padding-left:18px">${wishlist
			.map((w) => `<li><a href="${SITE_URL}/portfolio/${encodeURIComponent(buildPortfolioSlug(w.title, w.id))}">${esc(w.title)}</a></li>`)
			.join('')}</ul>`
		: '<span style="color:#888">없음</span>';

	const subject = `[상담신청] ${esc(body.clinic) || esc(body.department)} / ${esc(body.name)}`;
	const failedHtml = (list: FailedFile[]) =>
		`<div style="margin-top:6px;padding:8px 10px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:13px">
			⚠️ 아래 첨부파일은 전송되지 못했습니다. 고객에게 따로 받아주세요.
			<ul style="margin:4px 0 0;padding-left:18px">${list.map((f) => `<li>${esc(f.name)} — ${esc(f.reason)}</li>`).join('')}</ul>
		</div>`;

	// sent: 이 메일에 실제로 붙는 파일, laterCount: 이어서 나눠 보낼 메일 수
	const buildHtml = (sent: MailFile[], laterFiles: MailFile[], laterCount: number, failedList: FailedFile[]) => {
		const attached = sent.concat(laterFiles);
		const attachCell = (attached.length
			? `<ul style="margin:0;padding-left:18px">${attached.map((f) => `<li>${esc(f.filename)} (${formatBytes(f.size)})</li>`).join('')}</ul>`
				+ (laterCount ? `<p style="margin:6px 0 0;color:#64748b;font-size:12px">용량이 커서 첨부를 메일 ${laterCount + 1}통으로 나눠 보냅니다.</p>` : '')
			: (failedList.length ? '' : '<span style="color:#888">없음</span>'))
			+ (failedList.length ? failedHtml(failedList) : '');
		const rows: [string, string][] = [
			['병원명', esc(body.clinic) || '<span style="color:#888">미정</span>'],
			['진료과목', esc(body.department)],
			['담당자', esc(body.name)],
			['연락처', esc(body.phone)],
			['주소', esc(body.address)],
			['개원 여부', openStatus],
			['요청사항', esc(body.request) || '<span style="color:#888">없음</span>'],
			['참고 포트폴리오', wishHtml],
			['첨부파일', attachCell],
		];
		return `
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
	};

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
		connectionTimeout: 20 * 1000,
		greetingTimeout: 20 * 1000,
		socketTimeout: 60 * 1000,
	});
	const replyTo = typeof body.email === 'string' && body.email ? body.email : undefined;
	const toMailAttachments = (batch: MailFile[] = []) =>
		batch.map((f) => ({ filename: f.filename, content: f.content, contentType: f.contentType }));

	let batches = batchFiles(files);
	const sentFiles: MailFile[] = [];

	// 1) 상담신청 메일: 첫 묶음을 붙여 보내고, 실패하면 첨부 없이 다시 보낸다. 이것만은 반드시 나가야 한다.
	try {
		await transporter.sendMail({
			from: FROM_EMAIL, to: TO_EMAIL, replyTo,
			subject: batches.length > 1 ? `${subject} (첨부 1/${batches.length})` : subject,
			html: buildHtml(batches[0] ?? [], batches.slice(1).flat(), Math.max(0, batches.length - 1), failed),
			attachments: toMailAttachments(batches[0]),
		});
		sentFiles.push(...(batches[0] ?? []));
		batches = batches.slice(1);
	} catch (e) {
		if (!files.length) {
			console.error('[contact] 발송 예외', e);
			return NextResponse.json({ error: '메일 발송 중 오류가 발생했습니다.' }, { status: 502 });
		}
		console.error('[contact] 첨부 포함 발송 실패 → 첨부 없이 재발송', e);
		failed = failed.concat(files.map((f) => ({ name: f.filename, reason: '메일 첨부 발송 실패' })));
		batches = [];
		try {
			await transporter.sendMail({
				from: FROM_EMAIL, to: TO_EMAIL, replyTo, subject,
				html: buildHtml([], [], 0, failed),
			});
		} catch (e2) {
			console.error('[contact] 발송 예외(첨부 없이 재시도도 실패)', e2);
			return NextResponse.json({ error: '메일 발송 중 오류가 발생했습니다.' }, { status: 502 });
		}
	}

	// 2) 나머지 첨부 묶음. 실패해도 상담신청은 이미 접수됐으므로 기록만 남긴다.
	const total = batches.length + 1;
	const laterFailed: FailedFile[] = [];
	for (const [i, batch] of batches.entries()) {
		try {
			await transporter.sendMail({
				from: FROM_EMAIL, to: TO_EMAIL,
				subject: `${subject} (첨부 ${i + 2}/${total})`,
				html: `<p style="font-family:sans-serif;color:#1e293b">${esc(body.clinic) || esc(body.department)} · ${esc(body.name)} 님 상담신청의 첨부파일 ${i + 2}/${total}입니다.</p>`,
				attachments: toMailAttachments(batch),
			});
			sentFiles.push(...batch);
		} catch (e) {
			console.error('[contact] 추가 첨부 메일 실패', e);
			laterFailed.push(...batch.map((f) => ({ name: f.filename, reason: '메일 첨부 발송 실패' })));
		}
	}
	if (laterFailed.length) {
		failed = failed.concat(laterFailed);
		await transporter.sendMail({
			from: FROM_EMAIL, to: TO_EMAIL,
			subject: `${subject} (첨부 일부 전송 실패)`,
			html: `<div style="font-family:sans-serif">${failedHtml(laterFailed)}</div>`,
		}).catch((e) => console.error('[contact] 첨부 실패 안내 메일도 실패', e));
	}

	// 3) 메일에 들어간 원본은 Blob에서 지우고, 오래된 미사용 파일도 정리. 실패해도 응답에는 영향 없음.
	if (sentFiles.length) {
		await del(sentFiles.map((f) => f.pathname)).catch((e) => console.error('[contact] 첨부 삭제 실패', e));
	}
	if (process.env.BLOB_READ_WRITE_TOKEN) await cleanupOrphans();
	return NextResponse.json({ ok: true, attachmentFailed: failed.map((f) => f.name) });
}
