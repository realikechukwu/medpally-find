// The Workers runtime module behind the `send_email` binding.
declare module 'cloudflare:email' {
 export class EmailMessage {
  constructor(from: string, to: string, raw: string | ReadableStream);
  readonly from: string;
  readonly to: string;
 }
}
