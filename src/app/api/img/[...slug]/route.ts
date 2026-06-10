import { NextRequest, NextResponse } from 'next/server';
import { resolveNotionImageUrl, type ImageKind } from '@/lib/notion';

// Notion 이미지 프록시 (직접 전달 방식)
// 클라이언트는 /api/img/<pageId>/<kind>/<index> 같은 "안 죽는" 동일출처 주소를 사용한다.
// 이 라우트가 요청 시점에 Notion에서 싱싱한 S3 URL을 받아, 이미지 바이트를 서버에서 받아 그대로 전달한다.
//
// 왜 리다이렉트(307)가 아니라 직접 전달인가:
// - 리다이렉트는 브라우저가 "동일출처에서 시작 → 외부(S3)로 튕긴 응답"을 막는다.
//   no-cors면 ORB(ERR_BLOCKED_BY_ORB), crossOrigin을 붙이면 리다이렉트 CORS 처리에서 또 막힌다(CORS error).
// - 우리 서버(동일출처)가 바이트를 직접 내려주면 브라우저는 외부로 나가지 않으므로 ORB/CORS 자체가 발생하지 않는다. 항상 정상 로드.
// - 이미지 최적화는 끈 상태 유지(무료 한도). 대신 CDN/브라우저 캐시로 재요청을 줄인다.

const FETCH_TIMEOUT_MS = 15000;
// 포트폴리오는 자주 안 바뀌므로 길게 캐시 (CDN s-maxage / 브라우저 max-age)
const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;

	// slug = [pageId, kind, index]
	if (!Array.isArray(slug) || slug.length < 3) {
		return new NextResponse('Bad request', { status: 400 });
	}

	const [pageId, kindRaw, indexRaw] = slug;
	const kind = kindRaw as ImageKind;
	const index = Number.parseInt(indexRaw, 10);

	if ((kind !== 'cover' && kind !== 'add') || Number.isNaN(index) || index < 0) {
		return new NextResponse('Bad request', { status: 400 });
	}

	const target = await resolveNotionImageUrl(pageId, kind, index);
	if (!target) {
		return new NextResponse('Not found', {
			status: 404,
			headers: { 'Cache-Control': 'no-store' },
		});
	}

	// S3에서 이미지 바이트를 서버측에서 받아온다 (브라우저는 외부로 안 나감 → ORB/CORS 무관)
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const upstream = await fetch(target, { signal: controller.signal });
		if (!upstream.ok || !upstream.body) {
			return new NextResponse('Upstream error', {
				status: 502,
				headers: { 'Cache-Control': 'no-store' },
			});
		}

		const headers = new Headers();
		headers.set('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
		const len = upstream.headers.get('content-length');
		if (len) headers.set('Content-Length', len);
		headers.set('Cache-Control', CACHE_CONTROL);

		// 바이트를 그대로 스트리밍 전달
		return new NextResponse(upstream.body, { status: 200, headers });
	} catch {
		return new NextResponse('Fetch failed', {
			status: 502,
			headers: { 'Cache-Control': 'no-store' },
		});
	} finally {
		clearTimeout(timeout);
	}
}
