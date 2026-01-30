'use client';

import { useEffect, useState } from 'react';
import Home, { BuzaConfig, BuzaConfigKey } from '@/components/google/rich-calc';

function parseConfig(configString: string): BuzaConfig {
  const config: BuzaConfig = JSON.parse(configString);
  config.price = removeMaan(config.price);
  config.deposit = removeMaan(config.deposit);
  config.monthlyRent = removeMaan(config.monthlyRent);
  return config;
}

function removeMaan(origin: number) {
  return origin > 10000 ? origin / 10000 : origin;
}

export default function Dashboard() {
  const [localConfig, setLocalConfig] = useState<BuzaConfig | null>(null);

  useEffect(() => {
    const configString = localStorage.getItem(BuzaConfigKey);
    const config: BuzaConfig | undefined = configString ? parseConfig(configString) : undefined;
    const defaultConfig: BuzaConfig = config
      ? config
      : {
          price: 6800,
          deposit: 1000,
          monthlyRent: 40,
          rentRate: 60,
          surTaxRate: 6,
          registrationTaxRate: 4.6,
          interestRate: 3.5,
          commissionRate: 0.9,
        };
    setLocalConfig(defaultConfig);
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {localConfig !== null && <Home config={localConfig} />}
      <footer className="mt-8 text-center text-gray-500">토키보</footer>
    </main>
  );
}
