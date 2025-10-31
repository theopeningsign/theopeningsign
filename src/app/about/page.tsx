export const revalidate = 60;
import Image from "next/image";
import Link from "next/link";
import ContactInfo from "@/components/ContactInfo";

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold" style={{ color: '#ED6A26' }}>About us</h1>
        <p style={{ color: '#C24F1E' }}>THE OPENING SIGN</p>
      </header>

      <section className="rounded-xl border border-slate-200 p-6 bg-white space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: '#ED6A26' }}>HOSPITAL SIGNAGE PROFESSIONAL TEAM</h2>
        <p className="text-slate-700 leading-7">
          저희는 국내 1위 간판 전문 서비스 간판의품격에서 다양한 병의원 프로젝트 경험을 바탕으로 탄생한 병의원 사이니지 전문팀입니다.
        </p>
        <p className="text-slate-700 leading-7">
          병의원 사이니지 전문 경력을 지닌 2030으로 구성된 젊은 팀으로써 디테일 중시하며, 디자인의 힘으로 차별화된 결과를 만들어냅니다.
        </p>
      </section>



      {/* Top Priority Section */}
      <section className="space-y-8 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-wide" style={{ color: '#ED6A26' }}>TOP PRIORITY</h2>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {/* COMMUNICATION */}
          <div className="text-center">
            <div className="mx-auto mb-6 grid h-48 w-48 md:h-64 md:w-64 place-items-center rounded-full px-4 md:px-6" style={{ backgroundColor: '#ED6A26' }}>
              <span className="text-lg md:text-2xl font-medium tracking-tighter text-white leading-none">COMMUNICATION</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">편안한 소통</h3>
            <div className="mx-auto mt-3 mb-4 h-px w-3/4 bg-slate-300" />
            <p className="leading-7 text-slate-700">
              가장 중요하게 생각하는 가치로써<br/>
              편안하고 친절한 커뮤니케이션을 통한<br/>
              고객 의견개진과 니즈를 극대화
            </p>
          </div>

          {/* DESIGN */}
          <div className="text-center">
            <div className="mx-auto mb-6 grid h-48 w-48 md:h-64 md:w-64 place-items-center rounded-full px-4" style={{ backgroundColor: '#FF8C3C' }}>
              <span className="text-xl md:text-3xl font-semibold tracking-tight text-white">DESIGN</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">홍보효과를 위한 디자인</h3>
            <div className="mx-auto mt-3 mb-4 h-px w-3/4 bg-slate-300" />
            <p className="leading-7 text-slate-700">
              무조건적인 독창성보다 병원의 신뢰감과<br/>
              존재감을 바탕으로 외부 광고 효과를<br/>
              극대화하는 디자인을 지향함
            </p>
          </div>

          {/* TEAMWORK */}
          <div className="text-center">
            <div className="mx-auto mb-6 grid h-48 w-48 md:h-64 md:w-64 place-items-center rounded-full px-4" style={{ backgroundColor: '#FFB999' }}>
              <span className="text-xl md:text-3xl font-semibold tracking-tight text-white">TEAMWORK</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">적극적 협업</h3>
            <div className="mx-auto mt-3 mb-4 h-px w-3/4 bg-slate-300" />
            <p className="leading-7 text-slate-700">
              컨설턴트, 건물 관리인, 인테리어 담당과<br/>
              적극적인 협업을 통해 문제 발생 소지 및<br/>
              원장님의 스트레스를 최소화
            </p>
          </div>
        </div>
      </section>

      {/* Working Process Section (box) */}
      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold tracking-wide" style={{ color: '#ED6A26' }}>WORKING PROCESS</h2>
        {/* 가이드 라인 (우측 화살표 포함 수평선) */}
        {/* 끊김 없는 오른쪽 화살표 (라인 + 삼각형) */}
        <svg className="w-full" height="12" viewBox="0 0 100 12" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="6" x2="96" y2="6" stroke="#cbd5e1" strokeWidth="2" />
          <polygon points="96,3 100,6 96,9" fill="#cbd5e1" />
        </svg>

        {/* 단계 타이틀 (세부 내용은 추후 입력) */}
        <div className="grid gap-6 md:grid-cols-5">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">상담 및 컨셉 논의</div>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
              <li>간판 상담 접수</li>
              <li>1차 유선상담</li>
              <li>
                주요 일정체크
                <div className="text-slate-500">(개원/개설허가/실사 등)</div>
              </li>
              <li>현장 미팅 및 실측</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">외부 시안 및 현수막 공사</div>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
              <li>외부 사인물 및 현수막 시안도출</li>
              <li>외부 공사 견적 및 계약(선금 50%)</li>
              <li>개원 현수막 공사</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">내부 사인물 컨셉 미팅</div>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
              <li>
                내부 사인물 컨셉 논의
                <ul className="mt-1 list-none pl-5 space-y-0.5">
                  <li>- 조명 활용 여부</li>
                  <li>- 시그니처 컬러</li>
                  <li>- 사인물 소재</li>
                </ul>
              </li>
              <li>인테리어 목공 작업 이후 실측</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">내부 시안도출</div>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
              <li>내부 사인물 시안 도출</li>
              <li>내부 공사 견적 및 계약 (선금 50%)</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">내/외부 사인물 공사</div>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
              <li>개원 현수막 철거</li>
              <li>외부 사인물 공사</li>
              <li>내부 사인물 공사</li>
              <li>계약 종료 및 잔금 지급</li>
              <li>A/S 1년 보증</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-4">
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex-1 md:mr-4">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            <div className="flex-1 space-y-4">
              <h2 className="text-xl font-semibold tracking-wide" style={{ color: '#ED6A26' }}>CONTACT US</h2>
              <ContactInfo />
            </div>
            <div className="flex-shrink-0 self-center md:self-start md:mt-0">
              <Link 
                href="https://naver.me/5OQB63kr"
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer transition-opacity hover:opacity-90"
              >
                <Image 
                  src="/map.jpg" 
                  alt="오시는길 지도" 
                  width={400} 
                  height={300} 
                  className="w-full md:w-auto h-auto rounded-lg object-cover max-w-xs md:max-w-sm mx-auto"
                />
              </Link>
            </div>
          </div>
        </section>
        <div className="flex-shrink-0 md:ml-auto">
          <Image src="/logo.png" alt="THE OPENING SIGN" width={400} height={100} className="h-24 w-auto md:h-32" />
        </div>
      </div>
    </div>
  );
}


