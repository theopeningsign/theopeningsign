import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortfolios, getPortfolioById } from '@/lib/notion';
import { Suspense } from 'react';
import Gallery from '@/components/Gallery';
import type { Metadata } from 'next';
import HeroLightbox from '@/components/HeroLightbox';
import BackButton from '@/components/BackButton';
import ScrollToTop from '@/components/ScrollToTop';

export const revalidate = 60; // 1분 캐시 (정상 로드 시 빠름, 이미지 실패 시 자동 새로고침)

type MaybePromise<T> = T | Promise<T>;
interface Props {
    params: MaybePromise<{ id: string }>;
}

export default async function PortfolioDetailPage({ params }: Props) {
    const resolved = (typeof (params as any)?.then === 'function') ? await (params as any) : params as { id: string };
    const idParam = resolved?.id || '';
    let item;
    try {
        item = await getPortfolioById(idParam);
    } catch (error) {
        console.error('[PortfolioDetailPage] 포트폴리오 로드 실패:', error);
        // 에러 발생 시 notFound 처리
        return notFound();
    }
    if (!item) return notFound();

	return (
		<div className="space-y-8">
			<ScrollToTop />
			<BackButton />
			<header className="space-y-1">
				<h1 className="text-3xl font-extrabold text-slate-900">{item.title}</h1>
				<p className="text-slate-600">{item.location || '위치 미상'} | {item.type || '기타'} | {item.completedAt ? (() => { try { const parts = item.completedAt.split('-'); if (parts.length >= 2 && parts[0] && parts[1]) { const [y, m] = parts; return `${y}년 ${Number(m)}월`; } } catch {} return '연월 미상'; })() : '연월 미상'}</p>
				<p className="break-keep text-slate-600" style={{ overflowWrap: 'anywhere' }}>{item.departments && item.departments.length > 0 ? item.departments.join(' · ') : '\u00A0'}</p>
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
  let item;
  try {
    item = await getPortfolioById(idParam);
  } catch (error) {
    console.error('[generateMetadata] 포트폴리오 로드 실패:', error);
    // 에러 발생 시 기본 메타데이터 반환
    return { 
      title: '포트폴리오 상세 | 더오프닝사인 THE OPENING SIGN',
      description: '더오프닝사인 THE OPENING SIGN의 병원 간판 시공 포트폴리오',
    };
  }
  if (!item) return { 
    title: '포트폴리오 상세 | 더오프닝사인 THE OPENING SIGN',
    description: '더오프닝사인 THE OPENING SIGN의 병원 간판 시공 포트폴리오',
  };
  const title = `${item.title} | 더오프닝사인 THE OPENING SIGN 포트폴리오`;
  const description = `${item.title} ${item.location ? `- ${item.location}` : ''} ${item.type ? `| ${item.type}` : ''} ${item.completedAt ? (() => { try { const parts = item.completedAt.split('-'); if (parts.length >= 2 && parts[0] && parts[1]) { const [y, m] = parts; return `${y}년 ${Number(m)}월 시공`; } } catch {} return ''; })() : ''} | 더오프닝사인 THE OPENING SIGN의 병원 간판 시공 포트폴리오`.trim();
  const keywords = ["더오프닝사인", "THE OPENING SIGN", item.title, item.location, item.type, "병원 간판", "병원 간판 시공"].filter((k): k is string => Boolean(k));
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: item.coverImageUrl ? [{ url: item.coverImageUrl }] : undefined,
    },
  };
}

 

