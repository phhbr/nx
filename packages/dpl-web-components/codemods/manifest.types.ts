export interface CodemodEntry {
  version: string;
  id: string;
  description: string;
  fileExtensions: string[];
  transformPath: string;
  /** Optional: Developer guidance for manual cleanup or follow-up steps after migration. */
  developerHint?: string;
}