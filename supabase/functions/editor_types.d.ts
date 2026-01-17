// Helper types to silence editor errors when not using Deno extension
// This file does not affect the actual Deno runtime execution.

declare namespace Deno {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
  export const env: {
    get(key: string): string | undefined;
  };
}

declare module "https://*" {
  const value: any;
  export default value;
  export const createClient: any;
}
