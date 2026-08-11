/** Leaves headroom below Express's 2 MB JSON parser limit for transport variance. */
export const MAX_WORKSPACE_UPLOAD_BYTES = 1_800_000;

export function serializeWorkspaceUpload(state: unknown) {
  const body = JSON.stringify({ data: state });
  const bytes = new TextEncoder().encode(body).byteLength;
  return { body, bytes, withinBudget: bytes <= MAX_WORKSPACE_UPLOAD_BYTES };
}
