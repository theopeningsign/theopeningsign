import Link from "next/link";

export default function Home() {
  return (
    <>
    <section className="min-h-[70vh] grid items-center px-4 overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-2">
        {/* 왼쪽: 로고 (모바일에서 먼저, 데스크톱 좌측) */}
        <div className="logo-stage">
          {/* 로고 페이드인 이미지 */}
          <img src="/logo.png" alt="THE OPENING SIGN" className="relative z-10 w-[min(80vw,520px)] h-auto logo-fade-in" />
          {/* 반짝임 효과 제거 (로고만 페이드인) */}
        </div>
        {/* 오른쪽: 문구 (모바일에서는 로고 아래로) */}
        <div className="order-1 md:order-none flex flex-col gap-4 md:self-center md:pl-8 max-w-prose text-pretty break-keep">
          <h1 className="text-xl font-extrabold tracking-wide text-balance" style={{ color: '#ED6A26' }}>HOSPITAL SIGNAGE PROFESSIONAL TEAM</h1>
          <p className="text-base leading-7 text-slate-700 text-pretty break-keep">
            저희는 국내 1위 간판 전문 서비스 <span className="quote-highlight-double">간판의품격</span>에서 다양한 병의원 프로젝트 경험을 바탕으로 탄생한 병의원 사이니지 전문팀입니다.
          </p>
          <p className="text-base leading-7 text-slate-700 text-pretty break-keep">
            병의원 사이니지 전문 경력을 지닌 2030으로 구성된 젊은 팀으로써 디테일을 중시하며, 디자인의 힘으로 차별화된 결과를 만들어냅니다.
          </p>
        </div>
      </div>
    </section>
    {/* 하단 중앙 포트폴리오 보러가기 버튼 (모바일 겹침 방지: 음수 마진 제거) */}
    <div className="flex justify-center py-6 mt-2 md:mt-0">
      <Link
        href="/portfolio"
        className="rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition-colors"
        style={{ backgroundColor: '#D45720' }}
      >
        포트폴리오 보러가기
      </Link>
    </div>
    </>
  );
}
