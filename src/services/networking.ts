export const FETCH_TIMEOUT_MS = 10_000;

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function request(
  resource: RequestInfo,
  options: RequestInit = {},
  timeout = FETCH_TIMEOUT_MS
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError("Request timed out after " + timeout + " ms"));
    }, timeout);
    fetch(resource, options)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
