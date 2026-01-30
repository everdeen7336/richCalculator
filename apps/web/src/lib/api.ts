import axios from 'axios';
import {
  Terminal,
  DashboardApiResponse,
  ParkingApiResponse,
  CongestionApiResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

export async function fetchDashboard(
  terminal: Terminal,
  refresh = false
): Promise<DashboardApiResponse> {
  const { data } = await api.get<DashboardApiResponse>(`/dashboard/${terminal}`, {
    params: refresh ? { refresh: 'true' } : undefined,
  });
  return data;
}

export async function fetchParking(
  terminal: Terminal,
  refresh = false
): Promise<ParkingApiResponse> {
  const { data } = await api.get<ParkingApiResponse>(`/parking/${terminal}`, {
    params: refresh ? { refresh: 'true' } : undefined,
  });
  return data;
}

export async function fetchCongestion(
  terminal: Terminal,
  refresh = false
): Promise<CongestionApiResponse> {
  const { data } = await api.get<CongestionApiResponse>(`/congestion/${terminal}`, {
    params: refresh ? { refresh: 'true' } : undefined,
  });
  return data;
}
