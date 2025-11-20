import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortfolios, getPortfolioById } from '@/lib/notion';
import { Suspense } from 'react';
import Gallery from '@/components/Gallery';
import type { Metadata } from 'next';
import HeroLightbox from '@/components/HeroLightbox';
import BackButton from '@/components/BackButton';

export const revalidate = 300; // 5분 캐시 (첫 방문 후 매우 빠름)
export const dynamic = 'force-dynamic';

type MaybePromise<T> = T | Promise<T>;
interface Props {
    params: MaybePromise<{ id: string }>;
}

export default async function PortfolioDetailPage({ params }: Props) {
    const resolved = (typeof (params as any)?.then === 'function') ? await (params as any) : params as { id: string };
    const idParam = resolved?.id || '';
    const item = await getPortfolioById(idParam);
    if (!item) return notFound();

	return (
		<div className="space-y-8">
			<BackButton />
			<header className="space-y-1">
				<h1 className="text-3xl font-extrabold text-slate-900">{item.title}</h1>
				<p className="text-slate-600">{item.location || '위치 미상'} | {item.type || '기타'} | {item.completedAt ? (() => { const [y, m] = item.completedAt.split('-'); return `${y}년 ${Number(m)}월`; })() : '연월 미상'}</p>
			</header>
			{/* 메인 이미지(여러 장이면 모두 순서대로 크게 표시) */}
			{(item.coverImageUrls && item.coverImageUrls.length > 0
				? item.coverImageUrls
				: [item.coverImageUrl]
			).filter(Boolean).map((cover, idx) => (
				<div key={idx} className={idx > 0 ? 'mt-6' : ''}>
					<HeroLightbox cover={cover as string} covers={item.coverImageUrls} images={item.additionalImageUrls} title={item.title} coverIndex={idx} />
				</div>
			))}


			{/* 추가 이미지 갤러리 */}
			<Suspense fallback={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="h-40 animate-pulse rounded-lg bg-slate-200" />
				))}
            </div>}>
                <Gallery images={item.additionalImageUrls} covers={item.coverImageUrls} cover={item.coverImageUrl} />
			</Suspense>

			{/* 설명 (간단 텍스트 백업) - 갤러리 아래로 이동 */}
			{item.description && (
				<div className="prose max-w-none text-slate-800">
					<p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
				</div>
			)}
		</div>
	);
}

type MetadataProps = { params: MaybePromise<{ id: string }> };

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const resolved = (typeof (params as any)?.then === 'function') ? await (params as any) : params as { id: string };
  const idParam = resolved?.id || '';
  const item = await getPortfolioById(idParam);
  if (!item) return { title: '포트폴리오 상세' };
  const title = `${item.title} | THE OPENING SIGN 포트폴리오`;
  const description = `${item.location || ''} ${item.type || ''} ${item.completedAt ? (() => { const [y, m] = item.completedAt.split('-'); return `${y}년 ${Number(m)}월`; })() : ''}`.trim();
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: item.coverImageUrl ? [{ url: item.coverImageUrl }] : undefined,
    },
  };
}

 

