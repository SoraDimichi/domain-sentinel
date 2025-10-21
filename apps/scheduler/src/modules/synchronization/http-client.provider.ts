import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

export interface HttpClientOptions extends RequestInit {
  baseURL?: string;
  timeout?: number;
}

const errorSchema = z.object({ error: z.string(), message: z.string() });

@Injectable()
export class HttpClientProvider {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.baseURL = this.configService.get<string>('API_BASE_URL', 'https://dummyjson.com');
    this.timeout = this.configService.get<number>('API_TIMEOUT', 5000);
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async validateData<T>(schema: z.ZodType<T>, response: Response) {
    const data: unknown = await response.json();
    return await schema.parseAsync(data);
  }

  private async handleResponse<T>(response: Response, schema: z.ZodType<T>) {
    if (!response.ok) {
      const d = await this.validateData(errorSchema, response);
      throw new HttpException(
        d?.message || `Request failed with status ${response.status}`,
        response.status,
      );
    }

    return this.validateData(schema, response);
  }

  private async request<T>(url: string, options: HttpClientOptions, schema: z.ZodType<T>) {
    const mergedOptions: HttpClientOptions = {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
    };

    const fullUrl = this.baseURL ? `${this.baseURL}${url.startsWith('/') ? url : `/${url}`}` : url;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? this.timeout);

    try {
      const { signal } = controller;
      const response = await fetch(fullUrl, { ...mergedOptions, signal });
      return await this.handleResponse(response, schema);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpException(`Request timeout after ${options.timeout ?? this.timeout}ms`, 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildQueryParams<U extends Record<string, string>>(params?: U): string {
    if (!params) return '';

    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]);

    const queryParams = new URLSearchParams(query);
    const queryString = queryParams.toString();

    return queryString ? `?${queryString}` : '';
  }

  query<T, P extends Record<string, string> = Record<string, string>>(
    url: string,
    schema: z.ZodType<T>,
    params?: P,
    options: HttpClientOptions = {},
  ): Promise<T> {
    const queryString = this.buildQueryParams(params);
    const fullUrl = `${url}${queryString}`;

    return this.request<T>(fullUrl, { ...options, method: 'GET' }, schema);
  }
}
