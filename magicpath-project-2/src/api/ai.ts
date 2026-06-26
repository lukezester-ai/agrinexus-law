// src/api/ai.ts
export async function askAi(question: string) {
  // Simple mock implementation – in production replace with real endpoint
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!response.ok) {
      // Fallback to mock answer if server not available
      return { answer: 'Това е демонстративен отговор от AI.' };
    }
    return response.json(); // expected shape { answer: string }
  } catch (e) {
    // Network error – return mock answer
    return { answer: 'Това е демонстративен отговор от AI (мрежова грешка).' };
  }
}
