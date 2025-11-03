import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

async function handleRevalidate(request: NextRequest) {
  try {
    // 환경변수에서 시크릿 확인
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'REVALIDATE_SECRET이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 시크릿 키 검증
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // 포트폴리오 관련 경로 재검증
    revalidatePath('/portfolio');
    revalidatePath('/portfolio/[id]', 'page');

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: '포트폴리오 페이지 캐시가 성공적으로 갱신되었습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: '재검증 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRevalidate(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidate(request);
}

