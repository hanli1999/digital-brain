export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

