declare module "@concrnt/cfm" {
  export class SyntaxError extends Error {
    constructor(message: string, expected: any, found: any, location: any);
  }
  export function parse(input: string): any;
  const _default: { parse: typeof parse; SyntaxError: typeof SyntaxError };
  export default _default;
}
