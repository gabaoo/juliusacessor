import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number | string | null | undefined, currency = "BRL") {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return String(date);
  }
}

export function formatDateLong(date: string | Date | null | undefined) {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return String(date);
  }
}

export function formatTime(time: string | null | undefined) {
  if (!time) return "";
  return time.slice(0, 5);
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return String(iso);
  }
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function firstDayOfMonthISO(d = new Date()): string {
  return format(new Date(d.getFullYear(), d.getMonth(), 1), "yyyy-MM-dd");
}

export function lastDayOfMonthISO(d = new Date()): string {
  return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), "yyyy-MM-dd");
}
