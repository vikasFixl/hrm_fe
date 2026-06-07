import axios, { AxiosError } from "axios";

export const apiBaseUrl = import.meta.env.VITE_HRM_API_BASE_URL || "http://localhost:5001/api/hrm";

export const http = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void, reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the error comes from the refresh endpoint itself, reject immediately
    if (error.config?.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    const originalRequest = error.config as import("axios").InternalAxiosRequestConfig & { _retry?: boolean };

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return http(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send a request to refresh the token via HttpOnly cookies
        await http.post("/auth/refresh");
        processQueue(null);
        return http(originalRequest);
      } catch (err) {
        processQueue(err, null);
        window.dispatchEvent(new Event("auth-logout"));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function unwrap<T>(data: unknown): T {
  const value = data as { data?: T; result?: T; items?: T };
  return (value?.data ?? value?.result ?? value?.items ?? data) as T;
}

export function unwrapList<T>(data: unknown, keys: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];

  const value = data as Record<string, unknown>;
  const candidates = ["data", "result", "items", "records", "rows", ...keys];

  for (const key of candidates) {
    const candidate = value?.[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }

  return [];
}
