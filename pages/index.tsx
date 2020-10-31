import { Box, Card, CardContent, CardHeader, Container, createStyles, Grid, InputAdornment, makeStyles, TextField, Theme, Typography } from '@material-ui/core';
import Head from 'next/head'
import { useEffect, useState } from 'react';
import NumberFormat from 'react-number-format';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    textField: {
      marginRight: theme.spacing(1),
    },
    card: {
      marginBottom: theme.spacing(1),
    },
  }),
);

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

function NumberFormatCustom(props: NumberFormatCustomProps) {
  const { inputRef, onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
      thousandSeparator
      isNumericString
      prefix="₩"
    />
  );
}

export default function Home() {
  const classes = useStyles();

  const [price, setPrice] = useState<number>(6800);// 매매가
  const [deposit, setDeposit] = useState(1000);// 보증금
  const [monthlyRent, setMonthlyRent] = useState(40); // 월세 

  const [commission, setCommission] = useState(4.5); // 부동산 수수료 
  const [surTax, setSurTax] = useState(4.5);         // 부가세
  const [registrationTax, setRegistrationTax] = useState(4.5); // 취등록세

  const [loanedMoney, setLoanedMoney] = useState(0); // 취등록세

  const [neededCost, setNeededCost] = useState(0); // 필요비용
  const [cost, setCost] = useState(0); // 실 투자금

  const [annualRent, setAnnualRent] = useState(4.5); // 연임대수입
  const [annualInterest, setAnnualInterest] = useState(4.5); // 월 대출 이자
  const [monthlyInterest, setMonthlyInterest] = useState(4.5); // 월 대출 이자
  const [monthlyNetIncome, setMonthlyNetIncome] = useState(4.5); // 월 실수익
  const [annualNetIncome, setAnnualNetIncome] = useState(4.5); // 연 실수익

  const [realEarningRate, setRealEarningRate] = useState(4.5); // 수익율
  const [earningRate, setEarningRate] = useState(4.5); // 매매가 대비수익율

  const [rentRate, setRentRate] = useState(60); // 대출 비율
  const [surTaxRate, setSurTaxRate] = useState(6); // 부가세 비율
  const [registrationTaxRate, setRegistrationTaxRate] = useState(4.6); // 취등록세 비율
  const [interestRate, setInterestRate] = useState(3.5); // 이자율
  const [commissionRate, setCommissionRate] = useState(0.9); // 부동산중계 수수료율

  const compute = () => {
    // 실제 계산
    const priceMaan = price * 10000;
    const monthlyRentMaan = monthlyRent * 10000;
    const depositMaan = deposit * 10000;

    // 지출
    const commission = priceMaan * commissionRate / 100 * 1.1;
    const surTax = priceMaan * surTaxRate / 100;
    const registrationTax = priceMaan * registrationTaxRate / 100;
    setCommission(commission);
    setSurTax(surTax);
    setRegistrationTax(registrationTax);

    const loanedMoney = priceMaan * (rentRate / 100);
    setLoanedMoney(loanedMoney);

    // 투자금액
    const neededCost = priceMaan + commission + surTax + registrationTax - depositMaan - loanedMoney;
    const cost = neededCost - surTax;
    setNeededCost(neededCost)
    setCost(cost);

    // 수입 계산
    const annualInt = loanedMoney * interestRate / 100;
    setAnnualInterest(annualInt);
    setAnnualRent(monthlyRentMaan * 12);
    const monthlyInt = annualInt / 12;
    setMonthlyInterest(monthlyInt);
    const actualIncome = monthlyRentMaan - monthlyInt;
    setMonthlyNetIncome(actualIncome);
    setAnnualNetIncome(monthlyRentMaan * 12 - annualInt);

    // 수익율
    const earningRate = 100 * monthlyRentMaan * 12 / priceMaan;
    setEarningRate(Math.round(earningRate * 100) / 100);
    const realEarningRate = 100 * (actualIncome * 12) / cost;
    setRealEarningRate(Math.round(realEarningRate * 100) / 100);

  };

  useEffect(compute, [price, deposit, monthlyRent]);
  useEffect(compute, [rentRate, interestRate, surTaxRate, registrationTaxRate, commissionRate]);

  const handlePrice = (event) => { setPrice(event.target.value) };
  const handleDeposit = (event) => { setDeposit(event.target.value) };
  const handleRent = (event) => { setMonthlyRent(event.target.value) };

  const handleRentRate = (event) => { setRentRate(event.target.value) };
  const handleSurTaxRate = (event) => { setSurTaxRate(event.target.value) };
  const handleRegistrationTaxRate = (event) => { setRegistrationTaxRate(event.target.value) };
  const handleInterestRate = (event) => { setInterestRate(event.target.value) };
  const handleCommissionRate = (event) => { setCommissionRate(event.target.value) };

  return (
    <Container maxWidth="sm" className={classes.root}>
      <Head>
        <title>부자의 계산기</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Typography variant="h3" component="h1" gutterBottom>
        부자의 계산기
      </Typography>
      <Box my={4}>
        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <TextField
              className={classes.textField}
              label="매매가(만원)"
              onChange={handlePrice} value={price}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="임대보증금(만원)"
              onChange={handleDeposit} value={deposit}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="월세(만원)"
              onChange={handleRent} value={monthlyRent}
              size="small"
            />
          </CardContent>
        </Card>
        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <Typography variant="h6" component="h1" gutterBottom>
              계산결과
              </Typography>
            <TextField
              className={classes.textField}
              label="필요 투자금액"
              value={neededCost}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="실 투자금액(부가세 제외)"
              value={cost}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="년 임대수입"
              value={annualRent}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="연 대출이자"
              value={annualInterest}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="월 대출이자"
              value={monthlyInterest}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="월 실수익"
              value={monthlyNetIncome}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="년 실수익"
              value={annualNetIncome}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="수익율"
              value={realEarningRate}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="매매가 대비 수익율"
              value={earningRate}
              size="small"
            />
          </CardContent>
        </Card>
        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <Typography variant="h6" component="h1" gutterBottom>
              지출
              </Typography>
            <TextField
              className={classes.textField}
              label="부동산 중계수수료"
              value={commission}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="부가세"
              value={surTax}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="취등록세"
              value={registrationTax}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
          </CardContent>
        </Card>
        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <Typography variant="h6" component="h1" gutterBottom>
              레버리지
              </Typography>
            <TextField
              className={classes.textField}
              label="대출금"
              value={loanedMoney}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
            <TextField
              className={classes.textField}
              label="보증금"
              value={deposit * 10000}
              size="small"
              InputProps={{ inputComponent: NumberFormatCustom as any, }}
            />
          </CardContent>
        </Card>

        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <Typography variant="h6" component="h1" gutterBottom>
              설정
              </Typography>
            <TextField
              className={classes.textField}
              label="대출비율 %"
              onChange={handleRentRate} value={rentRate}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="이자율"
              onChange={handleInterestRate} value={interestRate}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="부가세 비율"
              onChange={handleSurTaxRate} value={surTaxRate}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="상가취등록세율"
              onChange={handleRegistrationTaxRate} value={registrationTaxRate}
              size="small"
            />
            <TextField
              className={classes.textField}
              label="부동산중계수수료율"
              onChange={handleCommissionRate} value={commissionRate}
              size="small"
            />
          </CardContent>
        </Card>
      </Box>

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
