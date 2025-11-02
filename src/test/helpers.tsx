// Test Helpers
// Utilities for writing tests

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * Create a new QueryClient for testing
 * Disables retries and caching for predictable test behavior
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Updated from cacheTime in React Query v5
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Create a wrapper with all necessary providers
 */
interface WrapperProps {
  children: React.ReactNode;
}

export function createWrapper(queryClient?: QueryClient) {
  const testQueryClient = queryClient || createTestQueryClient();
  
  return function Wrapper({ children }: WrapperProps) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={testQueryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  };
}

/**
 * Custom render function that includes all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();
  const wrapper = createWrapper(queryClient);

  return {
    ...render(ui, { wrapper, ...options }),
    queryClient,
  };
}

/**
 * Mock fetch with custom response
 */
export function mockFetch(data: any, status = 200, ok?: boolean) {
  const mockResponse = {
    ok: ok !== undefined ? ok : status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response;

  global.fetch = vi.fn(() => Promise.resolve(mockResponse));
  return mockResponse;
}

/**
 * Mock fetch to reject with error
 */
export function mockFetchError(error: Error | string) {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  global.fetch = vi.fn(() => Promise.reject(errorObj));
}

/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create mock localStorage for tests
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

/**
 * Mock window.matchMedia for responsive tests
 */
export function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Mock window.location for navigation tests
 */
export function mockWindowLocation(href = 'http://localhost:3000/') {
  delete (window as any).location;
  window.location = {
    href,
    pathname: new URL(href).pathname,
    search: new URL(href).search,
    hash: new URL(href).hash,
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
  } as any;
}

/**
 * Create a mock file for file upload tests
 */
export function createMockFile(
  name: string,
  size: number,
  type: string,
  lastModified = Date.now()
): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type, lastModified });
}

/**
 * Mock console methods to suppress output during tests
 */
export function mockConsole() {
  const originalConsole = { ...console };

  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.info = vi.fn();

  return {
    restore: () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    },
  };
}

/**
 * Generate a unique ID for tests
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Sleep for a specified duration
 * Useful for testing timing-sensitive code
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock event
 */
export function createMockEvent<T extends Event>(
  type: string,
  properties: Partial<T> = {}
): T {
  const event = new Event(type) as T;
  Object.assign(event, properties);
  return event;
}

/**
 * Assert that a function throws an error
 */
export async function expectToThrow(fn: () => any | Promise<any>, expectedError?: string) {
  let error: Error | undefined;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw an error');
  }

  if (expectedError && !error.message.includes(expectedError)) {
    throw new Error(`Expected error message to include "${expectedError}", got "${error.message}"`);
  }

  return error;
}
