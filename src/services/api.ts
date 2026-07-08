const API_BASE_URL = '/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('anvesha_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error('Backend server connection refused. Ensure Express server is running on port 5000 (run `npm run start`).');
  }

  const rawText = await response.text();
  let data: any = {};

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (jsonErr) {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): Backend API server on port 5000 is unreachable or proxy failed.`);
    }
    throw new Error('Invalid response format received from server.');
  }

  if (!response.ok && !data.success) {
    throw new Error(data.message || `API Error (${response.status})`);
  }

  return data as T;
}
