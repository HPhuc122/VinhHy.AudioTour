import { httpClient } from './httpClient';
import type { ApiResponse, QrDto } from '../types/api';

export interface StartAccessResponse {
  qr: QrDto;
  requiresPayment: boolean;
  amount: number;
  currency: string;
  accessDurationMinutes: number;
  paymentSessionId?: number | null;
  status: string;
  accessToken?: string | null;
  expiresAt?: string | null;
}

export interface SimulatePaymentResponse {
  status: string;
  accessToken?: string | null;
  expiresAt?: string | null;
  qrLocationId?: number | null;
  poiId?: number | null;
  tourId?: number | null;
}

export interface ValidateAccessResponse {
  isValid: boolean;
  status: string;
  expiresAt?: string | null;
  remainingSeconds: number;
  qrLocationId?: number | null;
  poiId?: number | null;
  tourId?: number | null;
}

export const publicAccessApi = {
  async start(qrCode: string, languageCode = 'vi'): Promise<StartAccessResponse> {
    const res = await httpClient.post<ApiResponse<StartAccessResponse>>('/public/access/start', {
      qrCode,
      languageCode,
    });
    return res.data.data;
  },

  async simulatePayment(
    paymentSessionId: number,
    success = true,
    languageCode = 'vi',
  ): Promise<SimulatePaymentResponse> {
    const res = await httpClient.post<ApiResponse<SimulatePaymentResponse>>(
      '/public/access/simulate-payment',
      { paymentSessionId, success, languageCode },
    );
    return res.data.data;
  },

  async validate(accessToken: string): Promise<ValidateAccessResponse> {
    const res = await httpClient.get<ApiResponse<ValidateAccessResponse>>('/public/access/validate', {
      headers: { 'X-Guest-Access-Token': accessToken },
    });
    return res.data.data;
  },
};
