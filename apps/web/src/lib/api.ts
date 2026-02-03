import type {
  CreateScanResponse,
  GetScanResponse,
  ConfirmScanRequest,
  ConfirmScanResponse,
  PricingRequest,
  PricingResponse,
  DraftRequest,
  DraftResponse,
  ApiError
} from '@i2k/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;
  private sessionId: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = localStorage.getItem('i2k_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('i2k_session_id', sessionId);
    }
    return sessionId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'X-Session-Id': this.sessionId,
      ...options.headers,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error?.message || 'An error occurred');
    }

    return response.json();
  }

  async uploadScan(file: File): Promise<CreateScanResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<CreateScanResponse>('/v1/scans', {
      method: 'POST',
      body: formData,
    });
  }

  async getScan(scanId: string): Promise<GetScanResponse> {
    return this.request<GetScanResponse>(`/v1/scans/${scanId}`);
  }

  async confirmScan(
    scanId: string,
    data: ConfirmScanRequest
  ): Promise<ConfirmScanResponse> {
    return this.request<ConfirmScanResponse>(`/v1/scans/${scanId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPricing(
    scanId: string,
    data?: PricingRequest
  ): Promise<PricingResponse> {
    return this.request<PricingResponse>(`/v1/scans/${scanId}/pricing`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async generateDraft(
    scanId: string,
    data: DraftRequest
  ): Promise<DraftResponse> {
    return this.request<DraftResponse>(`/v1/scans/${scanId}/draft`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Polling helper for scan status
  async pollScanStatus(
    scanId: string,
    targetStatus: string[],
    maxAttempts = 30,
    intervalMs = 1000
  ): Promise<GetScanResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const scan = await this.getScan(scanId);

      if (targetStatus.includes(scan.status) || scan.status === 'ERROR') {
        return scan;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Polling timeout');
  }
}

export const api = new ApiClient(API_BASE_URL);
