export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const validationMessage = problem?.errors
      ? Object.values(problem.errors as Record<string, string[]>).flat()[0]
      : null;
    throw new Error(problem?.message ?? problem?.detail ?? validationMessage ?? "Η ενέργεια δεν ολοκληρώθηκε.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(value);
