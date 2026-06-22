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
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 -mt-24 -mb-8"
      style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <HeroSlideshow images={heroImages} />
      {/* 가운데 정렬 단일 컬럼 — 정돈된 고급 레이아웃 */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
        <p className="text-lg sm:text-xl font-semibold uppercase tracking-[0.28em] text-white/90">
          Hospital Signage <span className="whitespace-nowrap">Professional Team</span>
        </p>
        {/* 구분선 제거 — 색만 빼고 빈 spacer로 둬서 기존 여백/간격은 유지 */}
        <div className="mt-5 mx-auto h-px w-12" />
        <p className="mt-6 max-w-xl text-pretty break-keep text-[15px] leading-8 text-white/85 sm:text-base">
          <span className="font-semibold text-white">『간판의품격』</span>에서 만든<br /><span className="whitespace-nowrap">메디컬 사인 전문팀입니다</span>
        </p>
        <p className="mt-3 max-w-xl text-pretty break-keep text-[15px] leading-8 text-white/75 sm:text-base">
          디테일을 중시하며, 디자인의 힘으로<br /><span className="whitespace-nowrap">차별화된 결과를 만들어냅니다</span>
        </p>
        {/* 로고 (흰색, 글자 아래) — 필터는 고정 wrapper에, 페이드는 이미지에 분리.
            (모바일 WebKit에서 필터+애니메이션을 같은 요소에 걸면 검정→흰색으로 튀는 현상 방지)
            원래 주황으로 되돌리려면 wrapper의 filter만 빼면 됨 */}
        <div className="mt-[3.75rem] [filter:brightness(0)_invert(1)_drop-shadow(0_4px_20px_rgba(0,0,0,0.45))]">
          <Image
            src="/logo.png"
            alt="THE OPENING SIGN"
            width={1156}
            height={683}
            className="logo-fade-in h-auto w-[min(90vw,510px)]"
            priority
          />
        </div>
      </div>
    </section>
    </Link>
    </>
  );
}
