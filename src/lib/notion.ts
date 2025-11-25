// ID 정규화: 어떤 입력이 와도 마지막 32자리 hex만 사용
function normalizeTo32Hex(input: string | undefined | null): string | null {
    if (!input) return null;
    const hexOnly = String(input).replace(/[^0-9a-fA-F]/g, '');
    const core = hexOnly.slice(-32);
    return /^[0-9a-fA-F]{32}$/.test(core) ? core : null;
}

// Notion API 연동 유틸 함수들 (SDK 대신 REST API fetch 사용)
import { PortfolioItem, NotionQueryOptions, SignType } from './types';

// 환경변수 로드
const NOTION_API_KEY = process.env.NOTION_API_KEY as string;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
	// 빌드 시점에 환경변수가 없으면 오류를 던져 조기 실패
	console.warn('[Notion] 환경변수(NOTION_API_KEY, NOTION_DATABASE_ID)가 설정되지 않았습니다.');
}

// fetch 타임아웃 유틸 (기본 10초)
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
    const { timeoutMs = 10000, ...rest } = init;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(input, { ...rest, signal: controller.signal, next: { revalidate: 60 }
         });
        return res;
    } finally {
        clearTimeout(id);
    }
}

// REST API 호출 헬퍼
async function notionQueryDatabase(body: any) {
    const res = await fetchWithTimeout(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        timeoutMs: 10000,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion query 실패: ${res.status} ${text}`);
    }
    return res.json();
}

// 페이지 단건 조회
async function notionRetrievePage(pageId: string) {
    const res = await fetchWithTimeout(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
        },
        timeoutMs: 10000,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion retrieve 실패: ${res.status} ${text}`);
    }
    return res.json();
}

// Notion 이미지 URL인지 확인
export function isNotionImageUrl(url: string): boolean {
	if (!url) return false;
	return url.includes('notion-static.com') || 
		   url.includes('amazonaws.com') || 
		   url.includes('prod-files-secure.s3');
}

// URL 정규화: Notion 이미지 URL을 안전하게 처리
function normalizeImageUrl(url: string | undefined): string | undefined {
	if (!url || typeof url !== 'string') return undefined;
	
	// URL이 유효한지 확인
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		// 상대 경로나 잘못된 형식
		return undefined;
	}
	
	// Notion 이미지 URL에서 불필요한 파라미터 제거 (선택적)
	// 일부 경우 URL에 특수 문자가 있어서 문제가 될 수 있음
	try {
		const urlObj = new URL(url);
		// URL이 유효하면 그대로 반환
		return url;
	} catch (e) {
		// URL 파싱 실패 (개발 환경에서만 로그)
		if (process.env.NODE_ENV === 'development') {
			console.warn('[Notion] 잘못된 URL 형식:', url);
		}
		return undefined;
	}
}

// 파일 속성에서 첫 번째 파일 URL을 추출 (더 robust한 처리)
function extractFirstFileUrl(files: any): string | undefined {
	if (!files || !Array.isArray(files) || files.length === 0) return undefined;
	const first = files[0];
	if (!first) return undefined;
	
	let url: string | undefined;
	
	// 다양한 Notion 파일 형식 지원
	if (first?.file?.url) url = first.file.url;
	else if (first?.external?.url) url = first.external.url;
	// name 속성에 URL이 있는 경우 (일부 Notion 버전)
	else if (first?.name && typeof first.name === 'string' && first.name.startsWith('http')) url = first.name;
	// 직접 URL 문자열인 경우
	else if (typeof first === 'string' && first.startsWith('http')) url = first;
	
	// URL 정규화
	if (url) {
		return normalizeImageUrl(url);
	}
	
	// 디버깅: 예상치 못한 형식 로그
	if (process.env.NODE_ENV === 'development') {
		console.warn('[Notion] 예상치 못한 파일 형식:', JSON.stringify(first, null, 2));
	}
	
	return undefined;
}

// 파일 속성에서 모든 파일 URL을 추출 (더 robust한 처리)
function extractAllFileUrls(files: any): string[] {
	if (!files || !Array.isArray(files)) return [];
	return files
		.map((f: any) => {
			if (!f) return undefined;
			
			let url: string | undefined;
			// 다양한 Notion 파일 형식 지원
			if (f?.file?.url) url = f.file.url;
			else if (f?.external?.url) url = f.external.url;
			// name 속성에 URL이 있는 경우
			else if (f?.name && typeof f.name === 'string' && f.name.startsWith('http')) url = f.name;
			// 직접 URL 문자열인 경우
			else if (typeof f === 'string' && f.startsWith('http')) url = f;
			
			// URL 정규화
			return url ? normalizeImageUrl(url) : undefined;
		})
		.filter(Boolean) as string[];
}

// 페이지를 PortfolioItem으로 매핑
function mapPageToPortfolioItem(page: any): PortfolioItem | null {
    if (!page || !page.properties) return null;
    const props = page.properties as any;
    // 제목 속성 탐색: 우선 '병원명', 없으면 type이 title인 첫 속성 사용 (최적화)
    const explicitTitle = props?.['병원명'];
    let title = '';
    if (explicitTitle?.title) {
        // '병원명' 속성이 있으면 직접 사용
        title = explicitTitle.title.map((t: any) => t?.plain_text || '').join('');
    } else {
        // 동적 탐색 (한 번만 실행)
        const dynamicTitleKey = Object.keys(props).find((k) => props[k]?.type === 'title');
        if (dynamicTitleKey && props[dynamicTitleKey]?.title) {
            title = props[dynamicTitleKey].title.map((t: any) => t?.plain_text || '').join('');
        }
    }
	if (!title) return null;

    const location: string | undefined = props?.['위치']?.rich_text?.map((t: any) => t?.plain_text).join('') || undefined;
    // 속성명 변경 + 다중 선택 대응: '시공종류'(multi_select) 우선, 없으면 과거명 '간판종류'(select)
    const typeMs: string[] | undefined = props?.['시공종류']?.multi_select?.map((s: any) => s?.name).filter(Boolean);
    const typeLegacy: string | undefined = props?.['간판종류']?.select?.name;
    const type: string | undefined = (typeMs && typeMs.length > 0) ? typeMs.join(' · ') : typeLegacy;
    const completedAt: string | undefined = props?.['시공완료']?.date?.start ?? undefined;
    // 진료과목 (Multi-select) - 다른 필드들과 동시에 불러옴
    const departments: string[] | undefined = props?.['진료과목']?.multi_select?.map((s: any) => s?.name).filter(Boolean);
    // 모든 가능한 이미지 속성명 체크
    const coverFiles = props?.['메인이미지']?.files
        ?? props?.['메인 이미지']?.files
        ?? props?.['대표이미지']?.files
        ?? props?.['대표 이미지']?.files
        ?? props?.['Cover']?.files
        ?? props?.['cover']?.files
        ?? props?.['이미지']?.files
        ?? props?.['Image']?.files;
    
    const coverImageUrl: string | undefined = extractFirstFileUrl(coverFiles);
    const coverImageUrls: string[] = extractAllFileUrls(coverFiles);
    
    // 디버깅: 이미지가 없는 경우 (개발 환경에서만 간단한 로그)
    if (!coverImageUrl && process.env.NODE_ENV === 'development') {
        console.warn(`[Notion] 이미지를 찾을 수 없음 - 제목: ${title}, ID: ${page.id}`);
    }
    const additionalImageUrls: string[] = extractAllFileUrls(
        // 실제 워크스페이스에서는 '보조이미지' 명칭 사용
        props?.['보조이미지']?.files
        // 과거 프롬프트/스키마에서는 '추가이미지'로 사용
        ?? props?.['추가이미지']?.files
    );
    const description: string | undefined = props?.['설명']?.rich_text?.map((t: any) => t?.plain_text).join('\n') || undefined;
	const createdTime: string | undefined = (props?.['작성일']?.created_time as string) || (page as any).created_time;

	return {
		id: page.id,
		title,
		location,
		type,
		completedAt,
		departments,
		coverImageUrl,
		coverImageUrls,
		additionalImageUrls,
		description,
		createdTime,
	};
}

// 공통 질의 옵션 생성 (노출여부=체크, 작성일 최신순)
function buildQueryOptions(options?: NotionQueryOptions): any {
    const filter: any = {
        and: [
            {
                property: '노출여부',
                checkbox: { equals: true },
            },
        ],
    };

    if (options?.filterType && options.filterType !== '전체') {
        // '시공종류'는 multi_select, '간판종류'는 select로 각각 필터링
        filter.and.push({
            or: [
                { property: '시공종류', multi_select: { contains: options.filterType } },
                { property: '간판종류', select: { equals: options.filterType } },
            ],
        });
    }

    return {
        // REST query 엔드포인트에서는 body에 database_id를 포함하지 않습니다
        filter,
        // 안전한 기본 정렬(생성일 내림차순). 실제 노출은 아래에서 '시공완료' 기준으로 재정렬합니다
        sorts: [
            { timestamp: 'created_time', direction: 'descending' },
        ],
        // 필요한 개수만 요청 (성능 최적화)
        page_size: options?.pageSize ?? 100, // 기본값을 100으로 설정 (충분한 데이터 확보)
    };
}

// 전체 포트폴리오 가져오기 (+옵션)
export async function getPortfolios(options?: NotionQueryOptions): Promise<PortfolioItem[]> {
	try {
        // 1차: 노출여부=true 필터 적용
        const first = await notionQueryDatabase(buildQueryOptions(options));
        let results = first.results
			.map(mapPageToPortfolioItem)
			.filter((x: any): x is PortfolioItem => Boolean(x));
        // 결과가 0개면(또는 DB에 '노출여부' 사용 안할 때) 필터 없이 재시도
        if (results.length === 0 && (!options || !options.filterType)) {
            const fallback = await notionQueryDatabase({
                sorts: [{ timestamp: 'created_time', direction: 'descending' }],
                page_size: options?.pageSize,
            });
            results = fallback.results
                .map(mapPageToPortfolioItem)
                .filter((x: unknown): x is PortfolioItem => Boolean(x));
        }
        // 필요 시 '시공완료'가 있는 항목만 남기기
        if (options?.onlyWithCompletedAt) {
            results = results.filter((p: PortfolioItem) => Boolean(p.completedAt));
        }

        // '시공완료' 최신순으로 재정렬, 없으면 작성일로 폴백
        const getSortKey = (p: PortfolioItem): number => {
            // completedAt(YYYY-MM-DD) 우선
            if (p.completedAt) {
                const t = Date.parse(p.completedAt);
                if (!Number.isNaN(t)) return t;
            }
            // createdTime 폴백
            if ((p as any).createdTime) {
                const t2 = Date.parse((p as any).createdTime as string);
                if (!Number.isNaN(t2)) return t2;
            }
            return 0;
        };
        // 시공완료가 있는 항목을 우선 배치하고, 같은 조건에서는 최신순
        results.sort((a: PortfolioItem, b: PortfolioItem) => {
            const aHas = Boolean(a.completedAt);
            const bHas = Boolean(b.completedAt);
            if (aHas !== bHas) return aHas ? -1 : 1;
            return getSortKey(b) - getSortKey(a);
        });

        // 요청된 pageSize가 있으면 거기까지만 잘라서 반환
        if (options?.pageSize) {
            return results.slice(0, options.pageSize);
        }
        return results;
	} catch (error) {
		console.error('[Notion] getPortfolios 에러', error);
		throw new Error('포트폴리오 데이터를 불러오지 못했습니다.');
	}
}

// ID로 포트폴리오 단건 조회
export async function getPortfolioById(id: string): Promise<PortfolioItem | null> {
    try {
        const normalized = normalizeTo32Hex(id);
        if (!normalized) return null;
        const hyphenated = `${normalized.slice(0,8)}-${normalized.slice(8,12)}-${normalized.slice(12,16)}-${normalized.slice(16,20)}-${normalized.slice(20)}`;
        try {
            const page = await notionRetrievePage(hyphenated);
            const mapped = mapPageToPortfolioItem(page);
            if (mapped) return mapped;
        } catch (e) {
            // 단건 조회 권한/네트워크 문제 발생 시 목록 데이터로 폴백
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Notion] retrieve 실패, 목록 데이터로 폴백 시도', e);
            }
        }
        const list = await getPortfolios();
        return list.find((p) => normalizeTo32Hex(p.id) === normalized) ?? null;
    } catch (error) {
        console.error('[Notion] getPortfolioById 에러', error);
        return null;
    }
}

// 간판 종류별 필터
export async function filterByType(type: SignType | '전체'): Promise<PortfolioItem[]> {
	return getPortfolios({ filterType: type });
}

// 상세 콘텐츠 렌더링을 위해 블록 리스트를 가져올 수 있도록 export (react-notion-x용)
// notion-client를 사용해 페이지 콘텐츠를 가져오는 경우가 많으나,
// 여기서는 데이터 로딩을 페이지에서 수행하도록 헬퍼만 노출합니다.
// SDK 클라이언트 export 제거 (REST 사용)

