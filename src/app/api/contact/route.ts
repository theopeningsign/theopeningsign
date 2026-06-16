import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

	const openStatus = body.openStatus === 'before' ? '개원 전' : '영업 중';

	const wishlist: WishItem[] = Array.isArray(body.wishlist) ? (body.wishlist as WishItem[]) : [];
	const wishHtml = wishlist.length
		? `<ul style="margin:0;padding-left:18px">${wishlist
			.map((w) => `<li><a href="${SITE_URL}/portfolio/${encodeURIComponent(w.id)}">${esc(w.title)}</a></li>`)
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
	try {
		await transporter.sendMail({
			from: FROM_EMAIL,
			to: TO_EMAIL,
			replyTo: typeof body.email === 'string' && body.email ? body.email : undefined,
			subject: `[상담신청] ${esc(body.clinic) || esc(body.department)} / ${esc(body.name)}`,
			html,
		});
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error('[contact] 발송 예외', e);
		return NextResponse.json({ error: '메일 발송 중 오류가 발생했습니다.' }, { status: 502 });
	}
}
