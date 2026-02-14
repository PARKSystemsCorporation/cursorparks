declare module "@/src/state/introFlow" {
  export function getEnterApiBase(): string;
  export function createGuestSessionId(): string;
  export function getGuestSessionId(): string | null;
  export function isFirstTimeUser(): boolean;
  export function markIntroDone(): void;
  export function enterWithHandle(
    handle: string,
    password: string,
    options?: { acceptTerms18?: boolean }
  ): Promise<unknown>;
  export function setPasswordForHandle(handle: string, password: string): Promise<unknown>;
}
