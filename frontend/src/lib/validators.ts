export const PHONE_RE = /^(\+994|0)(50|51|55|70|77|10|99|60|66)\d{7}$/;
export const VOEN_RE = /^\d{10}$/;
export const SLUG_RE = /^[a-zA-Z0-9_-]{3,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(v: string): string {
  return v.replace(/[\s\-()]/g, "");
}

export function validatePhone(v: string): string | null {
  const n = normalizePhone(v);
  if (!n) return "Telefon tələb olunur";
  if (!PHONE_RE.test(n)) return "Nümunə: +994501234567";
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v) return "Email tələb olunur";
  if (!EMAIL_RE.test(v)) return "Email düzgün deyil";
  return null;
}

export function validatePassword(v: string): string | null {
  if (!v) return "Şifrə tələb olunur";
  if (v.length < 6) return "Ən az 6 simvol";
  if (v.length > 72) return "Maksimum 72 simvol";
  return null;
}

export function validateVoen(v: string): string | null {
  if (!v) return null; // optional
  if (!VOEN_RE.test(v)) return "VOEN 10 rəqəm olmalıdır";
  return null;
}

export function validateSlug(v: string): string | null {
  if (!v) return "Slug tələb olunur";
  if (!SLUG_RE.test(v)) return "Yalnız hərf, rəqəm, _, - (3-30 simvol)";
  return null;
}

export function validateRequired(v: string, label: string, min = 2, max = 255): string | null {
  if (!v || !v.trim()) return `${label} tələb olunur`;
  if (v.trim().length < min) return `${label}: ən az ${min} simvol`;
  if (v.trim().length > max) return `${label}: maksimum ${max} simvol`;
  return null;
}
