# Product Plan — 여행 대시보드 (Travel Dashboard)

> 이 문서는 새 대화에서도 컨텍스트를 유지하기 위한 영구 설계 문서입니다.
> 마지막 업데이트: v2 — 고도화 완료 (실제 동작 버전)

---

## 1. 제품의 목적 및 가치 (Product Vision)

- **브랜드 핵심**: "들여다보고 있는 것만으로도 내 마음이 정리되는 도구"
- **타겟**: 여행의 '정보'보다 '무드'와 '몰입'을 중요하게 생각하며, 복잡한 앱 UI에 피로감을 느끼는 여행자
- **해결하려는 문제**: 광고/과도한 정보 추천/경직된 AI 일정/현장 정보 과부하 제거

## 2. 디자인 원칙 (Visual & UX Identity)

- **컬러 스택**: Matte Beige (`#F5F5DC`), Soft Warm Gray (`#E8E4DF`), Deep Charcoal (`#2C2C2C`)
- **레이아웃**: Bento Grid — 여백(White Space) 30% 이상 확보
- **Anti-Pop-up**: 사용자 동의 없는 팝업/광고 절대 금지 (AdSense 제거 완료)
- **인터랙션**: 모든 화면 전환은 Fade 방식 (심리적 안정감)

## 3. 핵심 기능 (Core Features) — 구현 완료

### ① '비워내기' 계획 모드 (Distraction-free Canvas) ✅
- **파일**: `components/journey/CanvasSearch.tsx`
- 장소 입력 → 18개 카테고리 분위기 키워드 자동 매칭
- 드래그 앤 드롭으로 순서 재정렬 (HTML5 Drag API)
- 개별 삭제 버튼 (hover 시 노출)
- store 영구 저장 (localStorage)

### ② '조용한 조력자' AI (Soft-Nudge AI) ✅
- **파일**: `components/journey/SoftNudge.tsx`
- nearest-neighbor 알고리즘 기반 순서 최적화
- 최적화 순서 미리보기 (최대 4곳)
- "바꿀게요" 클릭 시 실제 reorderItems 실행
- 이미 최적이면 아이콘 숨김

### ③ '지금, 여기' 어댑티브 카드 (Context-Aware Card) ✅
- **파일**: `components/journey/ContextCard.tsx`
- 시간대별 자동 전환: 이동/식사/하루정리/여유
- 실제 journey items에서 다음 방문지 동적 추출
- 오늘 지출, 남은 예산, 방문 통계 실시간 표시

## 4. 사용자 여정 (User Flow) — 4단계 적응형 UI

| Phase | 한국어 | Bento Grid 구성 | 핵심 인터랙션 |
|-------|--------|-----------------|---------------|
| `preparing` | 준비 | 시계+날씨+출입국+캔버스+공항현황+예산+체크리스트 | 장소 추가, 예산 설정 |
| `coordinating` | 조율 | 캔버스(확대)+시계+날씨+예산+체크리스트 | 드래그 재정렬, AI 넛지 |
| `onsite` | 현지 | Context Card+공항현황+날씨+시계+예산+체크리스트 | 지출 기록, 체크 |
| `recording` | 기록 | 타임라인+예산정산+시계+날씨 | 방문 기록, 통계 확인 |

## 5. 기술 스택

- **Framework**: Next.js 14 (App Router)
- **State**: Zustand (persist middleware) — `journey-storage` key
- **Data Fetching**: TanStack React Query + Axios + Next.js API Routes
- **Styling**: Tailwind CSS 3.4 + CSS Variables
- **Backend**: Express + cheerio scraper + node-cron
- **Weather**: `/api/weather` → OpenWeatherMap (폴백: 월별 시뮬레이션)

## 6. 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                    — 적응형 대시보드 (4-phase)
│   ├── layout.tsx                  — 루트 레이아웃
│   ├── globals.css                 — 디자인 토큰 + 애니메이션
│   └── api/weather/route.ts        — 날씨 API Route
├── components/
│   ├── bento/
│   │   ├── BentoCard.tsx           — 카드 베이스 (default/accent/dark)
│   │   ├── ClockWidget.tsx         — 실시간 시계
│   │   ├── WeatherWidget.tsx       — 날씨 (API 연동)
│   │   ├── BudgetWidget.tsx        — 예산 + 지출 기록
│   │   ├── ScheduleWidget.tsx      — 체크리스트 (store 연동)
│   │   ├── AirportStatusWidget.tsx — 실시간 공항 혼잡도
│   │   └── QuickLinkCard.tsx       — 출입국 바로가기
│   └── journey/
│       ├── CanvasSearch.tsx         — 장소 검색 + 드래그
│       ├── SoftNudge.tsx           — AI 최적화 제안
│       ├── ContextCard.tsx         — 시간대별 적응형 카드
│       ├── PhaseIndicator.tsx      — 여정 단계 네비게이션
│       └── RecordingTimeline.tsx   — 방문 타임라인 + 기록
├── stores/
│   ├── journey.store.ts            — 여정 전체 상태 (확장)
│   ├── terminal.store.ts           — 터미널 선택
│   └── settings.store.ts           — 자동 새로고침 설정
└── types/
    ├── journey.ts                  — 여정 타입 (확장)
    └── index.ts                    — 배럴 export
```

## 7. Journey Store 구조 (Zustand)

```typescript
interface JourneyStoreState {
  phase: JourneyPhase;              // 4단계 여정
  items: JourneyItem[];             // 방문할 장소 목록
  budget: BudgetCategory[];         // 예산 카테고리 (자동 지출 집계)
  expenses: Expense[];              // 지출 기록
  checklist: ChecklistItem[];       // 출국 체크리스트
  visitRecords: VisitRecord[];      // 방문 기록 (타임라인)
  totalBudget: number;
  departureDate: string;
  destination: string;
}
```

## 8. 주요 컬러 토큰

| Token | Hex | 용도 |
|-------|-----|------|
| `--bg-primary` | `#F5F5DC` | Matte Beige 배경 |
| `--bg-card` | `#FAFAF5` | 카드 배경 |
| `--bg-card-hover` | `#F0EDE8` | 카드 호버 |
| `--text-primary` | `#2C2C2C` | Deep Charcoal 본문 |
| `--text-secondary` | `#8A8578` | Warm Gray 보조 텍스트 |
| `--text-muted` | `#B8B2A8` | 뮤트 텍스트 |
| `--accent` | `#7C9A8E` | Sage Green 액센트 |
| `--border` | `#E8E4DF` | Soft Warm Gray 보더 |

## 9. 애니메이션 시스템

```css
.fade-in       — 0.6s ease-out opacity
.fade-in-up    — 0.5s ease-out opacity + translateY(12px)
.fade-in-delay-1~7 — 0.08s 간격 staggered 입장
```

모든 phase 전환 시 각 카드가 순차적으로 fade-in-up 합니다.
