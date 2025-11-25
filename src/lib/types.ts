// Notion 데이터 매핑을 위한 타입 정의

// 호환을 위해 과거(간판종류)와 현재(시공종류) 옵션을 모두 포함
export type SignType =
  | '내부'
  | '외부'
  | '내부/외부 통합'
  | '시안'
  | '현수막'
  | 'LED채널'
  | '아크릴'
  | '네온'
  | '복합'
  | '기타';

export interface PortfolioItem {
	// Notion 페이지 ID
	id: string;
	// 병원명 (Title)
	title: string;
	// 위치 (Rich text)
	location?: string;
    // 시공종류/간판종류 (Multi-select 또는 Select)
    // 다중 선택 시 UI에서 보기 좋도록 합쳐진 텍스트로 보관
    type?: string;
	// 시공완료 (Date) => 연도/날짜 문자열
	completedAt?: string;
	// 진료과목 (Multi-select)
	departments?: string[];
	// 메인 이미지 URL (Files & media)
	coverImageUrl?: string;
	// 메인 이미지가 여러 장일 수 있어 배열도 노출
	coverImageUrls?: string[];
	// 추가 이미지 URL들
	additionalImageUrls: string[];
	// 설명 (Rich text, react-notion-x로 렌더링할 원본 블록 ID 등)
	description?: string; // 간단 텍스트 백업
	// 정렬용 작성일 (Created time)
	createdTime?: string;
}

export interface NotionQueryOptions {
	// 간판 종류 필터
	filterType?: SignType | '전체';
	// 불러올 개수 제한
    pageSize?: number;
    // 시공완료가 있는 항목만 노출
    onlyWithCompletedAt?: boolean;
}


