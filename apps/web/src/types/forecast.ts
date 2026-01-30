import { Terminal } from './terminal';

export interface HourlyInOutData {
  hour: number;
  timeSlot: string;
  departure: {
    gate1: number;
    gate2: number;
    gate3: number;
    gate4: number;
    gate56: number;
    total: number;
  };
  arrival: {
    ab: number;
    c: number;
    d: number;
    ef: number;
    total: number;
  };
}

export interface HourlyRouteData {
  hour: number;
  timeSlot: string;
  japan: number;
  china: number;
  southeastAsia: number;
  northAmerica: number;
  europe: number;
  oceania: number;
  other: number;
}

export interface CongestionForecast {
  terminal: Terminal;
  date: string;
  inOutData: HourlyInOutData[];
  routeData: HourlyRouteData[];
  summary: {
    totalDeparture: number;
    totalArrival: number;
    peakDepartureHour: number;
    peakDepartureCount: number;
    peakArrivalHour: number;
    peakArrivalCount: number;
  };
  lastUpdated: string;
}

export type CongestionForecastApiResponse = import('./api').ApiResponse<CongestionForecast>;
