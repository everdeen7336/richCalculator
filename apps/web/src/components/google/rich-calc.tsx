'use client';

import { useEffect, useState, useRef } from 'react';
import { NumericFormat } from 'react-number-format';

declare global {
  interface Window {
    kakao?: {
      adfit?: {
        request: (element: HTMLElement) => void;
      };
    };
  }
}

export const BuzaConfigKey = 'BuzaConfig';

export interface BuzaConfig {
  price: number;
  deposit: number;
  monthlyRent: number;
  rentRate: number;
  surTaxRate: number;
  registrationTaxRate: number;
  interestRate: number;
  commissionRate: number;
}

interface HomeProps {
  config: BuzaConfig;
}

export default function Home(props: HomeProps) {
  const adfitRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number>(props.config.price); // 매매가
  const [deposit, setDeposit] = useState(props.config.deposit); // 보증금
  const [monthlyRent, setMonthlyRent] = useState(props.config.monthlyRent); // 월세

  const [commission, setCommission] = useState(4.5); // 부동산 수수료
  const [surTax, setSurTax] = useState(4.5); // 부가세
  const [registrationTax, setRegistrationTax] = useState(4.5); // 취등록세

  const [loanedMoney, setLoanedMoney] = useState(0); // 대출금

  const [neededCost, setNeededCost] = useState(0); // 필요비용
  const [cost, setCost] = useState(0); // 실 투자금

  const [annualRent, setAnnualRent] = useState(4.5); // 연임대수입
  const [annualInterest, setAnnualInterest] = useState(4.5); // 연 대출 이자
  const [monthlyInterest, setMonthlyInterest] = useState(4.5); // 월 대출 이자
  const [monthlyNetIncome, setMonthlyNetIncome] = useState(4.5); // 월 실수익
  const [annualNetIncome, setAnnualNetIncome] = useState(4.5); // 연 실수익

  const [realEarningRate, setRealEarningRate] = useState(4.5); // 수익율
  const [earningRate, setEarningRate] = useState(4.5); // 매매가 대비수익율

  const [rentRate, setRentRate] = useState(props.config.rentRate); // 대출 비율
  const [surTaxRate, setSurTaxRate] = useState(props.config.surTaxRate); // 부가세 비율
  const [registrationTaxRate, setRegistrationTaxRate] = useState(
    props.config.registrationTaxRate
  ); // 취등록세 비율
  const [interestRate, setInterestRate] = useState(props.config.interestRate); // 이자율
  const [commissionRate, setCommissionRate] = useState(props.config.commissionRate); // 부동산중계 수수료율

  const [price3, setPrice3] = useState(0);
  const [price4, setPrice4] = useState(0);
  const [price5, setPrice5] = useState(0);
  const [price6, setPrice6] = useState(0);

  useEffect(() => {
    // Adfit 광고 스크립트 로드
    if (typeof window !== 'undefined' && adfitRef.current) {
      const script = document.createElement('script');
      script.src = 'https://t1.daumcdn.net/kas/static/ba.min.js';
      script.async = true;
      script.charset = 'utf-8';
      
      const adfitDiv = document.createElement('ins');
      adfitDiv.className = 'kakao_ad_area';
      adfitDiv.style.display = 'none';
      adfitDiv.setAttribute('data-ad-unit', 'DAN-5h2qZkJGgVNjQpgM');
      adfitDiv.setAttribute('data-ad-width', '320');
      adfitDiv.setAttribute('data-ad-height', '50');
      
      adfitRef.current.appendChild(adfitDiv);
      
      script.onload = () => {
        if (window.kakao && window.kakao.adfit) {
          window.kakao.adfit.request(adfitDiv);
          adfitDiv.style.display = 'block';
        }
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (adfitRef.current && adfitDiv.parentNode) {
          adfitDiv.parentNode.removeChild(adfitDiv);
        }
      };
    }
  }, []);

  useEffect(() => {
    // 실제 계산
    const priceMaan = price * 10000;
    const depositMaan = deposit * 10000;
    const monthlyRentMaan = monthlyRent * 10000;

    // 월세 역산 가격
    setPrice6((monthlyRentMaan * 1200) / 6);
    setPrice5((monthlyRentMaan * 1200) / 5);
    setPrice4((monthlyRentMaan * 1200) / 4);
    setPrice3((monthlyRentMaan * 1200) / 3);

    // 지출
    const commission = (priceMaan * commissionRate) / 100 * 1.1;
    const surTax = (priceMaan * surTaxRate) / 100;
    const registrationTax = (priceMaan * registrationTaxRate) / 100;
    setCommission(Math.round(commission));
    setSurTax(surTax);
    setRegistrationTax(registrationTax);

    const loanedMoney = (priceMaan * rentRate) / 100;
    setLoanedMoney(loanedMoney);

    // 투자금액
    const neededCost = priceMaan + commission + surTax + registrationTax - depositMaan - loanedMoney;
    const cost = neededCost - surTax;
    setNeededCost(neededCost);
    setCost(cost);

    // 수입 계산
    const annualInt = (loanedMoney * interestRate) / 100;
    setAnnualInterest(annualInt);
    setAnnualRent(monthlyRentMaan * 12);
    const monthlyInt = annualInt / 12;
    setMonthlyInterest(Math.round(monthlyInt));
    const actualIncome = monthlyRentMaan - monthlyInt;
    setMonthlyNetIncome(Math.round(actualIncome));
    setAnnualNetIncome(monthlyRentMaan * 12 - annualInt);

    // 수익율
    const earningRate = (100 * monthlyRentMaan * 12) / priceMaan;
    setEarningRate(Math.round(earningRate * 100) / 100);
    const realEarningRate = (100 * (actualIncome * 12)) / cost;
    setRealEarningRate(Math.round(realEarningRate * 100) / 100);

    // 로컬스토리지 저장
    const screenConfig: BuzaConfig = {
      price: price * 10000,
      deposit: deposit * 10000,
      monthlyRent: monthlyRent * 10000,
      rentRate,
      surTaxRate,
      registrationTaxRate,
      interestRate,
      commissionRate,
    };
    localStorage.setItem(BuzaConfigKey, JSON.stringify(screenConfig));
  }, [
    price,
    deposit,
    monthlyRent,
    rentRate,
    interestRate,
    surTaxRate,
    registrationTaxRate,
    commissionRate,
  ]);

  const handlePrice = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(Number(event.target.value));
  };
  const handleDeposit = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeposit(Number(event.target.value));
  };
  const handleRent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlyRent(Number(event.target.value));
  };

  const handleRentRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRentRate(Number(event.target.value));
  };
  const handleSurTaxRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSurTaxRate(Number(event.target.value));
  };
  const handleRegistrationTaxRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationTaxRate(Number(event.target.value));
  };
  const handleInterestRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInterestRate(Number(event.target.value));
  };
  const handleCommissionRate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommissionRate(Number(event.target.value));
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-4 mt-2">상가 수익율 계산기</h1>
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매매가(만원)
              </label>
              <input
                type="number"
                onChange={handlePrice}
                value={price}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                임대보증금(만원)
              </label>
              <input
                type="number"
                onChange={handleDeposit}
                value={deposit}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">월세(만원)</label>
              <input
                type="number"
                onChange={handleRent}
                value={monthlyRent}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="my-4" ref={adfitRef}></div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">수익율 별 매매가 역산</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">3%</label>
              <NumericFormat
                value={price3}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">4%</label>
              <NumericFormat
                value={price4}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">5%</label>
              <NumericFormat
                value={price5}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">6%</label>
              <NumericFormat
                value={price6}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">계산결과</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수익율</label>
              <input
                type="text"
                value={realEarningRate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">매매가 대비 수익율</label>
              <input
                type="text"
                value={earningRate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">필요 투자금액</label>
              <NumericFormat
                value={neededCost}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                실 투자금액(부가세 제외)
              </label>
              <NumericFormat
                value={cost}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연 대출이자</label>
              <NumericFormat
                value={annualInterest}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">년 임대수입</label>
              <NumericFormat
                value={annualRent}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">월 대출이자</label>
              <NumericFormat
                value={monthlyInterest}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm bg-red-50 text-red-700"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">월 실수익</label>
              <NumericFormat
                value={monthlyNetIncome}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm bg-blue-50 text-blue-700"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">년 실수익</label>
              <NumericFormat
                value={annualNetIncome}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">레버리지</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">대출금</label>
              <NumericFormat
                value={loanedMoney}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">보증금</label>
              <NumericFormat
                value={deposit * 10000}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">지출</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부동산 중계수수료
              </label>
              <NumericFormat
                value={commission}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">부가세</label>
              <NumericFormat
                value={surTax}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">취등록세</label>
              <NumericFormat
                value={registrationTax}
                thousandSeparator
                prefix="₩"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                customInput={(props: any) => <input {...props} />}
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            취등록세는 매매가 기준이며, 공시지가 기준이 아닙니다. 법무등기비용은 포함되지 않았습니다.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대출비율 %</label>
              <input
                type="number"
                onChange={handleRentRate}
                value={rentRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이자율</label>
              <input
                type="number"
                onChange={handleInterestRate}
                value={interestRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부가세 비율</label>
              <input
                type="number"
                onChange={handleSurTaxRate}
                value={surTaxRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상가취등록세율</label>
              <input
                type="number"
                onChange={handleRegistrationTaxRate}
                value={registrationTaxRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부동산중계수수료율
              </label>
              <input
                type="number"
                onChange={handleCommissionRate}
                value={commissionRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
