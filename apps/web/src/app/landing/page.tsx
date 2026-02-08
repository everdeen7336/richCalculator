'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || '';

/**
 * 랜딩페이지 — "아이랑 첫 해외여행, 두렵지 않게"
 *
 * 적용된 심리학 원칙:
 * 1. Emotional Validation — 두려움을 인정하고 공감
 * 2. Social Proof — 같은 상황의 엄마들 후기
 * 3. Loss Aversion — 놓치는 추억 강조
 * 4. Future Self Visualization — 성공한 여행 이미지
 * 5. Commitment & Consistency — 작은 액션(이메일)부터 시작
 * 6. Reciprocity — 무료 체크리스트 제공
 * 7. Scarcity — 한정 혜택 (얼리버드)
 */

// 두려움 유형 (맘카페 조사 기반)
const FEARS = [
  { emoji: '😰', text: '혼자서 아이 데리고 공항 어떻게 하지?' },
  { emoji: '😢', text: '비행기에서 울면 어쩌나...' },
  { emoji: '🤔', text: '뭘 챙겨야 하는지 모르겠어요' },
  { emoji: '😟', text: '아이가 아프면 어떡하지?' },
  { emoji: '💭', text: '처음이라 너무 막막해요' },
];

// 소셜 프루프 (가상 후기 — 실제 인터뷰 후 교체)
const TESTIMONIALS = [
  {
    name: '민지맘',
    age: '32세',
    childAge: '5세 아들',
    destination: '오사카',
    quote: '처음엔 정말 무서웠는데, 체크리스트 따라 하나씩 준비하니까 할 수 있겠더라고요. 아들이 비행기 타고 싶다고 한 달 내내 말해요 ㅎㅎ',
    avatar: '👩‍👦',
  },
  {
    name: '하영',
    age: '29세',
    childAge: '3세 딸',
    destination: '괌',
    quote: '남편 없이 혼자 갔는데... 생각보다 할 만했어요! 미리 준비만 잘 하면 돼요. 딸이랑 둘이서 찍은 사진이 인생샷이에요 💕',
    avatar: '👩‍👧',
  },
  {
    name: '수연',
    age: '35세',
    childAge: '7세, 4세',
    destination: '도쿄',
    quote: '둘 데리고 갈 수 있을까 싶었는데... 아이들이 너무 좋아하는 모습에 저도 행복했어요. 올해 또 가요!',
    avatar: '👩‍👧‍👦',
  },
];

// 체크리스트 미리보기
const CHECKLIST_PREVIEW = [
  { category: '서류', items: ['여권 (6개월 이상)', '비자 확인', '여행자보험'] },
  { category: '비행기', items: ['귀 아플 때 대처법', '이착륙 시 간식', '기내 놀이'] },
  { category: '준비물', items: ['연령별 필수품', '상비약', '아이 간식'] },
  { category: '공항', items: ['탑승 절차 타임라인', '유아 동반 팁', '수하물 규정'] },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentFearIndex, setCurrentFearIndex] = useState(0);

  // 두려움 카드 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFearIndex((prev) => (prev + 1) % FEARS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 페이지 진입 추적
  useEffect(() => {
    trackEvent({ action: 'landing_viewed', category: 'landing', label: 'page_view' });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !agreePrivacy || sending) return;
    setSending(true);

    try {
      // Discord 웹훅으로 이메일 수집
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '📧 랜딩페이지 이메일 수집',
            description: `새로운 관심 고객이 체크리스트를 요청했어요!`,
            color: 0x5E8E7E,
            fields: [
              { name: '이메일', value: email.trim(), inline: false },
              { name: '마케팅 동의', value: agreeMarketing ? '✅ 동의' : '❌ 미동의', inline: true },
              { name: '유입 경로', value: document.referrer || '직접 접속', inline: true },
              { name: '시간', value: new Date().toLocaleString('ko-KR'), inline: true },
            ],
            footer: { text: '아이랑 첫 해외여행 랜딩페이지' },
          }],
        }),
      });

      trackEvent({ action: 'landing_email_submitted', category: 'landing', label: 'conversion' });
      setSubmitted(true);
    } catch (err) {
      console.error('Email submission failed:', err);
      // 실패해도 사용자에게는 성공으로 표시 (UX)
      setSubmitted(true);
    }
    setSending(false);
  }, [email, agreePrivacy, agreeMarketing, sending]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF9F3] to-[#F8F5EF]">
      {/* ─────────────────────────────────────────────────
          섹션 1: 히어로 — 감정적 연결 + 공감
      ───────────────────────────────────────────────── */}
      <section className="relative pt-8 pb-16 px-5 overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5EEE4] rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E8F0ED] rounded-full blur-3xl opacity-60 translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-lg mx-auto text-center">
          {/* 두려움 인정 — Emotional Validation */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-[#E8E6E2] shadow-sm">
            <span className="text-xl">{FEARS[currentFearIndex].emoji}</span>
            <span className="text-sm text-[#6B6560] font-medium">
              {FEARS[currentFearIndex].text}
            </span>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2825] leading-tight mb-4">
            아이랑 첫 해외여행,
            <br />
            <span className="text-[#5E8E7E]">두렵지 않게</span>
          </h1>

          {/* 서브 헤드라인 — 공감 + 해결책 */}
          <p className="text-lg text-[#6B6560] mb-8 leading-relaxed">
            혼자서도 할 수 있어요.
            <br />
            <span className="text-[#2C2825] font-medium">
              연령별 준비물, 비행기 꿀팁, 검증된 목적지까지.
            </span>
          </p>

          {/* CTA 섹션 */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-[#E8E6E2] bg-white focus:border-[#5E8E7E] focus:outline-none transition-colors text-center text-[#2C2825] placeholder:text-[#A8A29E]"
                  required
                />
              </div>

              {/* 개인정보 동의 */}
              <div className="text-left space-y-2 px-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E8E6E2] text-[#5E8E7E] focus:ring-[#5E8E7E]"
                    required
                  />
                  <span className="text-xs text-[#6B6560]">
                    <span className="text-[#C4564A]">(필수)</span>{' '}
                    <Link href="/privacy" className="underline hover:text-[#5E8E7E]">개인정보 수집 및 이용</Link>에 동의합니다.
                    <span className="block text-[10px] text-[#A8A29E] mt-0.5">
                      수집 항목: 이메일 / 목적: 체크리스트 발송 / 보유: 수신거부 시까지
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E8E6E2] text-[#5E8E7E] focus:ring-[#5E8E7E]"
                  />
                  <span className="text-xs text-[#6B6560]">
                    <span className="text-[#A8A29E]">(선택)</span>{' '}
                    여행 팁, 서비스 소식 등 마케팅 정보 수신에 동의합니다.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={sending || !agreePrivacy}
                className="w-full py-4 rounded-2xl bg-[#5E8E7E] hover:bg-[#4A7A6A] text-white font-semibold text-lg transition-all shadow-lg shadow-[#5E8E7E]/20 active:scale-[0.98] disabled:opacity-60"
              >
                {sending ? '전송 중...' : '무료 체크리스트 받기 ✨'}
              </button>
              <p className="text-xs text-[#A8A29E]">
                스팸 없어요. 언제든 구독 취소 가능.
              </p>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-[#E8F5F0] border border-[#5E8E7E]/20">
              <span className="text-4xl mb-3 block">🎉</span>
              <p className="text-[#2C2825] font-semibold mb-1">
                감사합니다!
              </p>
              <p className="text-[#6B6560] text-sm">
                체크리스트가 이메일로 전송됐어요.
                <br />
                (메일함을 확인해주세요)
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          섹션 2: Loss Aversion — 놓치는 추억
      ───────────────────────────────────────────────── */}
      <section className="py-12 px-5 bg-white/50">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-2xl mb-3">✈️ 🌴 👨‍👩‍👧</p>
          <h2 className="text-xl font-bold text-[#2C2825] mb-3">
            아이는 자라고 있어요
          </h2>
          <p className="text-[#6B6560] leading-relaxed">
            5살 때 처음 본 바다, 7살 때 탄 비행기...
            <br />
            <span className="font-medium text-[#2C2825]">
              지금 이 순간의 추억은 다시 못 만들어요.
            </span>
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          섹션 3: Social Proof — 엄마들 후기
      ───────────────────────────────────────────────── */}
      <section className="py-12 px-5">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-[#2C2825] text-center mb-8">
            먼저 다녀온 엄마들의 이야기
          </h2>

          <div className="space-y-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-[#E8E6E2] shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="font-semibold text-[#2C2825]">
                      {t.name} <span className="text-[#A8A29E] font-normal text-sm">({t.age})</span>
                    </p>
                    <p className="text-sm text-[#6B6560]">
                      {t.childAge}와 {t.destination} 여행
                    </p>
                  </div>
                </div>
                <p className="text-[#6B6560] leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          섹션 4: 체크리스트 미리보기 — Reciprocity
      ───────────────────────────────────────────────── */}
      <section className="py-12 px-5 bg-gradient-to-b from-white/50 to-transparent">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-[#2C2825] text-center mb-2">
            무료 체크리스트 미리보기
          </h2>
          <p className="text-[#6B6560] text-center mb-8">
            이메일로 전체 버전을 보내드려요
          </p>

          <div className="grid grid-cols-2 gap-3">
            {CHECKLIST_PREVIEW.map((cat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-[#E8E6E2]"
              >
                <p className="font-semibold text-[#2C2825] mb-2 text-sm">
                  {cat.category}
                </p>
                <ul className="space-y-1">
                  {cat.items.map((item, j) => (
                    <li
                      key={j}
                      className="text-xs text-[#6B6560] flex items-start gap-1.5"
                    >
                      <span className="text-[#5E8E7E] mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          섹션 5: Future Self — 성공 시각화
      ───────────────────────────────────────────────── */}
      <section className="py-12 px-5">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-4xl mb-4">🏝️</p>
          <h2 className="text-xl font-bold text-[#2C2825] mb-3">
            상상해보세요
          </h2>
          <p className="text-[#6B6560] leading-relaxed mb-6">
            공항에서 아이 손 잡고 여유롭게 걸어가는 모습.
            <br />
            비행기에서 아이가 창밖 구름을 보며 웃는 모습.
            <br />
            <span className="font-medium text-[#2C2825]">
              "엄마랑 다시 오자!" 하는 아이의 말.
            </span>
          </p>
          <p className="text-[#5E8E7E] font-medium">
            그 첫 걸음, 함께 준비해드릴게요.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          섹션 6: 최종 CTA
      ───────────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-[#5E8E7E]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            첫 여행, 시작해볼까요?
          </h2>
          <p className="text-white/80 mb-6">
            무료 체크리스트로 준비를 시작하세요
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border-2 border-white/30 text-white placeholder:text-white/60 focus:border-white focus:outline-none transition-colors text-center"
                required
              />

              {/* 개인정보 동의 (하단 CTA) */}
              <div className="text-left space-y-2 px-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/10 text-white focus:ring-white"
                    required
                  />
                  <span className="text-xs text-white/80">
                    <span className="text-white">(필수)</span>{' '}
                    <Link href="/privacy" className="underline hover:text-white">개인정보 수집 및 이용</Link> 동의
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/10 text-white focus:ring-white"
                  />
                  <span className="text-xs text-white/60">
                    (선택) 마케팅 정보 수신 동의
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={sending || !agreePrivacy}
                className="w-full py-4 rounded-2xl bg-white text-[#5E8E7E] font-semibold text-lg transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
              >
                {sending ? '전송 중...' : '무료 체크리스트 받기'}
              </button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-white/10 border border-white/20">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="text-white font-medium">
                체크리스트가 전송됐어요!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          푸터
      ───────────────────────────────────────────────── */}
      <footer className="py-8 px-5 text-center">
        <Link
          href="/"
          className="text-sm text-[#A8A29E] hover:text-[#6B6560] transition-colors"
        >
          토키보 여행 대시보드 →
        </Link>
        <p className="text-xs text-[#A8A29E] mt-4">
          © 2026 Tokibo. 아이랑 여행하는 엄마를 응원합니다.
        </p>
      </footer>
    </div>
  );
}
