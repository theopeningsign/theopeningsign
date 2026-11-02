// 상담신청 첨부파일 규칙 (브라우저·서버 공용)
// 파일은 브라우저에서 Vercel Blob(비공개)으로 원본 그대로 올리고, 서버가 메일에 첨부한 뒤 Blob에서 지운다.

export const ATTACH_PREFIX = 'contact/';
export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;   // 파일 1개 최대 15MB
export const MAX_TOTAL_BYTES = 60 * 1024 * 1024;  // 한 번에 최대 60MB
// 메일 1통에 넣을 첨부 합계. 첨부는 전송 시 약 1.37배로 커지므로 수신 한도(25MB)보다 여유 있게 잡는다.
export const MAIL_BATCH_BYTES = 15 * 1024 * 1024;

export const ALLOWED_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	heic: 'image/heic',
	heif: 'image/heif',
	pdf: 'application/pdf',
};

export const ACCEPT_ATTR = Object.keys(ALLOWED_TYPES).map((e) => `.${e}`).join(',');

export function fileExt(name: string): string {
	const m = /\.([a-z0-9]+)$/i.exec(name);
	return m ? m[1].toLowerCase() : '';
}

export function formatBytes(n: number): string {
	if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))}KB`;
	return `${(n / 1024 / 1024).toFixed(1).replace(/\.0$/, '')}MB`;
}

export type AttachmentRef = { pathname: string; name: string };
