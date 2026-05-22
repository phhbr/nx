export type WarnHandler = (message: string) => void;

export interface RewriteOutcome {
  value: string;
  changed: boolean;
}
