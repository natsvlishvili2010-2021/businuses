// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}
