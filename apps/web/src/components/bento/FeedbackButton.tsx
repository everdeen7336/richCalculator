'use client';

import { useState, useCallback } from 'react';
import { GA } from '@/lib/analytics';

const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || '';

type FeedbackType = 'bug' | 'feature' | 'general';

const TYPE_META: Record<FeedbackType, { label: string; emoji: string; color: string }> = {
  bug:     { label: '버그 신고',  emoji: '🐛', color: '#C4564A' },
  feature: { label: '기능 제안',  emoji: '💡', color: '#C49A6C' },
  general: { label: '기타 문의',  emoji: '💬', color: '#4A7BA7' },
};

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || sending) return;
    setSending(true);

    try {
      const meta = TYPE_META[type];
      const fields = email.trim()
        ? [{ name: '📧 답장 이메일', value: email.trim(), inline: false }]
        : [];
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `${meta.emoji} ${meta.label}`,
            description: message.trim(),
            color: parseInt(meta.color.slice(1), 16),
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: '토키보 피드백' },
          }],
        }),
      });
      GA.feedbackSent(type);
      setDone(true);
      setMessage('');
      setEmail('');
      setTimeout(() => { setDone(false); setOpen(false); }, 1500);
    } catch {
      alert('전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
    setSending(false);
  }, [message, type, sending]);

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full bg-[var(--text-primary)] text-white shadow-lg hover:bg-[var(--accent)] transition-all duration-300 hover:scale-105 flex items-center justify-center"
        aria-label="문의하기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* 모달 */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* 배경 */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !sending && setOpen(false)} />

          {/* 카드 */}
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-light)] shadow-xl p-5 fade-in-up">
            {done ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-[var(--text-primary)] font-medium">감사합니다! 소중한 의견이 전달되었어요.</p>
              </div>
            ) : (
              <>
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">서비스 문의</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* 유형 선택 */}
                <div className="flex gap-2 mb-4">
                  {(Object.keys(TYPE_META) as FeedbackType[]).map((t) => {
                    const m = TYPE_META[t];
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 text-[11px] py-2 rounded-xl border transition-all ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
                        }`}
                      >
                        {m.emoji} {m.label}
                      </button>
                    );
                  })}
                </div>

                {/* 메시지 입력 */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="어떤 점이 불편하셨나요? 자유롭게 적어주세요."
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border)] rounded-xl p-3 resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <p className="text-[10px] text-[var(--text-muted)] text-right mt-1 mb-3">{message.length}/1000</p>

                {/* 이메일 (선택) */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="답장 받을 이메일 (선택)"
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border)] rounded-xl px-3 py-2.5 mb-3 focus:outline-none focus:border-[var(--accent)] transition-colors"
                />

                {/* 전송 버튼 */}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || sending}
                  className="w-full text-[12px] py-2.5 rounded-xl bg-[var(--text-primary)] text-white font-medium hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
                >
                  {sending ? '전송 중...' : '보내기'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
