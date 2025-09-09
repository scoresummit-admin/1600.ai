export async function runPython(code: string, inputs?: object): Promise<{
  ok: boolean;
  result?: any;
  stdout?: string;
  error?: string;
}> {
  const maxRetries = 2;
  let lastError: string = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch('/api/py/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, inputs }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429 || response.status >= 500) {
        // Retry on rate limit or server errors
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
      }

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          error: 'Python execution timeout (6s)'
        };
      }

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  return {
    ok: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`
  };
}