import Link from "next/link";
import Image from "next/image";
import fs from "node:fs";
import path from "node:path";
import HeroSlideshow from "@/components/HeroSlideshow";

// public/main/ 폴더의 이미지를 자동으로 읽어온다 (파일만 넣고 빼면 끝, 코드 수정 불필요)
function getHeroImages(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "main");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/main/${f}`);
  } catch {
    return [];
  }
}

export default function Home() {
  const heroImages = getHeroImages();

  return (
    <>
    <Link href="/portfolio" className="block cursor-pointer outline-none focus:outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
    {/* 전체 너비로 꽉 차게 (max-w-6xl 컨테이너 밖으로 빠져나오는 풀블리드) */}
    <section
      className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4 -mt-8 -mb-8"
      style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <HeroSlideshow images={heroImages} />
      {/* 가운데 정렬 단일 컬럼 — 정돈된 고급 레이아웃 */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
        <Image
          src="/logo.png"
          alt="THE OPENING SIGN"
          width={520}
          height={520}
          className="logo-fade-in h-auto w-[min(72vw,420px)] opacity-95 [filter:saturate(0.85)_brightness(0.96)_drop-shadow(0_8px_30px_rgba(0,0,0,0.5))]"
          priority
        />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 sm:text-sm">
          Hospital Signage Professional Team
        </p>
        <div className="mt-5 mx-auto h-px w-12 bg-white/40" />
        <p className="mt-6 max-w-xl text-pretty break-keep text-[15px] leading-8 text-white/85 sm:text-base">
          국내 1위 간판 전문 서비스 <span className="font-semibold text-white">『간판의품격』</span>에서 다양한 병의원 프로젝트 경험을 바탕으로 탄생한 병의원 사이니지 전문팀입니다.
        </p>
        <p className="mt-3 max-w-xl text-pretty break-keep text-[15px] leading-8 text-white/75 sm:text-base">
          디테일을 중시하며, 디자인의 힘으로 차별화된 결과를 만들어냅니다.
        </p>
      </div>
    </section>
    </Link>
    </>
  );
}
