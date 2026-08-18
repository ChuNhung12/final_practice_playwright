import { APIRequestContext } from '@playwright/test';

export class ApiClient {
  private readonly baseURL: string;

  constructor(private readonly request: APIRequestContext) {
    this.baseURL = process.env.BASE_URL ?? '';
  }

  async loginForToken(username: string, password: string): Promise<string> {
    const res = await this.request.post(`${this.baseURL}/api/auth/login`, {
      data: { username, password },
    });
    if (!res.ok()) throw new Error(`login failed: ${res.status()} ${await res.text()}`);
    const body = await res.json();
    return body.token as string;
  }

  async getProfileName(token: string): Promise<string> {
    const res = await this.request.get(`${this.baseURL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) throw new Error(`getProfile failed: ${res.status()} ${await res.text()}`);
    const body = await res.json();
    return body.name as string;
  }

  async updateProfileName(token: string, name: string): Promise<void> {
    const res = await this.request.patch(`${this.baseURL}/api/profile`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { name },
    });
    if (!res.ok()) throw new Error(`updateProfile failed: ${res.status()} ${await res.text()}`);
  }

  async seedOrder(token: string, orderData: object): Promise<string> {
    const res = await this.request.post(`${this.baseURL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: orderData,
    });
    if (!res.ok()) throw new Error(`seedOrder failed: ${res.status()} ${await res.text()}`);
    const body = await res.json();
    return body.id as string;
  }

  async deleteOrder(token: string, orderId: string): Promise<void> {
    const res = await this.request.delete(`${this.baseURL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) throw new Error(`deleteOrder failed: ${res.status()} ${await res.text()}`);
  }
}
