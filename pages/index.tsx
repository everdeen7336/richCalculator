import { Container, createStyles, makeStyles, Theme } from '@material-ui/core';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next'

import Home, { BuzaConfig, BuzaConfigKey } from '../components/google/rich-calc';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
    },
  }),
);

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
  const classes = useStyles();
  const [localConfig, setLocalConfig] = useState<BuzaConfig | null>(null);

  useEffect(() => {
    const configString = localStorage.getItem(BuzaConfigKey);
    const config: BuzaConfig | undefined = configString && parseConfig(configString);
    const defaultConfig: BuzaConfig = config ? config : {
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
    <Container maxWidth="lg" className={classes.root}>
      <Head>
        <title>우쿨나뭇잎의 상가 수익율 계산기</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <script data-ad-client="ca-pub-7233017559577101" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
      </Head>

      {localConfig !== null && <Home config={localConfig} />}

      <footer>
        Made by Everdeen
      </footer>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </Container>
  )
}
