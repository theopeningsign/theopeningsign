import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ALLOWED_TYPES, ATTACH_PREFIX, MAX_FILE_BYTES, fileExt } from '@/lib/attachments';

// 브라우저가 Blob에 직접 올릴 수 있도록 업로드 토큰을 발급한다.
// 로그인 없는 공개 폼이라 경로·형식·크기·유효시간으로만 제한한다.
const PATH_RE = new RegExp(`^${ATTACH_PREFIX}\\d{8}/[a-z0-9-]+\\.([a-z0-9]+)$`);

export async function POST(req: NextRequest) {
	let body: HandleUploadBody;
	try {
		body = (await req.json()) as HandleUploadBody;
	} catch {
		return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
	}

	try {
		const result = await handleUpload({
			body,
			request: req,
			onBeforeGenerateToken: async (pathname) => {
				const m = PATH_RE.exec(pathname);
				if (!m || !ALLOWED_TYPES[fileExt(pathname)]) {
					throw new Error('허용되지 않는 파일입니다.');
				}
				return {
					allowedContentTypes: [ALLOWED_TYPES[fileExt(pathname)]],
					maximumSizeInBytes: MAX_FILE_BYTES,
					addRandomSuffix: true,
					validUntil: Date.now() + 10 * 60 * 1000,
				};
			},
		});
		return NextResponse.json(result);
	} catch (e) {
		console.error('[contact/upload] 토큰 발급 실패', e);
		return NextResponse.json({ error: '파일 업로드를 준비하지 못했습니다.' }, { status: 400 });
	}
}
