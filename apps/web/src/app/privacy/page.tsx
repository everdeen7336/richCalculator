import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 토키보',
  description: '토키보 서비스의 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] py-12 px-5">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/landing"
          className="inline-flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#5E8E7E] mb-8"
        >
          ← 돌아가기
        </Link>

        <h1 className="text-2xl font-bold text-[#2C2825] mb-8">
          개인정보처리방침
        </h1>

        <div className="prose prose-sm max-w-none text-[#6B6560] space-y-8">
          {/* 1. 개인정보 수집 항목 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              1. 수집하는 개인정보 항목
            </h2>
            <p>
              토키보는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
            </p>
            <table className="w-full mt-3 text-sm border border-[#E8E6E2]">
              <thead className="bg-[#F5F4F1]">
                <tr>
                  <th className="border border-[#E8E6E2] px-3 py-2 text-left">수집 항목</th>
                  <th className="border border-[#E8E6E2] px-3 py-2 text-left">수집 목적</th>
                  <th className="border border-[#E8E6E2] px-3 py-2 text-left">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#E8E6E2] px-3 py-2">이메일</td>
                  <td className="border border-[#E8E6E2] px-3 py-2">여행 체크리스트 발송</td>
                  <td className="border border-[#E8E6E2] px-3 py-2">수신 거부 시까지</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 2. 수집 목적 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              2. 개인정보 수집 및 이용 목적
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>여행 준비 체크리스트 이메일 발송</li>
              <li>서비스 관련 중요 공지사항 전달</li>
              <li>마케팅 정보 수신 동의 시: 여행 팁, 서비스 업데이트 안내</li>
            </ul>
          </section>

          {/* 3. 보유 및 이용 기간 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <p>
              수집된 개인정보는 수집 목적 달성 시까지 보유하며,
              이용자가 수신 거부(구독 취소)를 요청하는 경우 즉시 파기합니다.
            </p>
          </section>

          {/* 4. 제3자 제공 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              4. 개인정보의 제3자 제공
            </h2>
            <p>
              토키보는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
              다만, 법령에 따른 요청이 있는 경우에는 예외로 합니다.
            </p>
          </section>

          {/* 5. 이용자 권리 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              5. 이용자의 권리
            </h2>
            <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>마케팅 수신 거부</li>
            </ul>
            <p className="mt-3">
              권리 행사는 이메일 내 수신거부 링크 또는 아래 연락처로 요청할 수 있습니다.
            </p>
          </section>

          {/* 6. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              6. 개인정보 보호책임자
            </h2>
            <p>
              개인정보 관련 문의사항은 아래로 연락해 주세요.
            </p>
            <div className="mt-3 p-4 bg-white rounded-xl border border-[#E8E6E2]">
              <p className="font-medium text-[#2C2825]">토키보 고객센터</p>
              <p className="text-sm mt-1">이메일: everdeen.7336@gmail.com</p>
            </div>
          </section>

          {/* 7. 시행일 */}
          <section>
            <h2 className="text-lg font-semibold text-[#2C2825] mb-3">
              7. 시행일
            </h2>
            <p>
              본 개인정보처리방침은 2026년 2월 8일부터 시행됩니다.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E8E6E2] text-center">
          <Link
            href="/landing"
            className="inline-block px-6 py-3 rounded-xl bg-[#5E8E7E] text-white font-medium hover:bg-[#4A7A6A] transition-colors"
          >
            체크리스트 받으러 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
