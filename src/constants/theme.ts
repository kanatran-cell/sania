export const COLORS = {
  primary: "#6366F1",
  secondary: "#EC4899",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  text: "#0F172A",
  textSecondary: "#64748B",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
} as const;

export const HEALTH_COLORS = {
  excellent: "#22C55E",
  good: "#84CC16",
  moderate: "#F59E0B",
  poor: "#EF4444",
} as const;

export function getHealthColor(score: number): string {
  if (score >= 80) return HEALTH_COLORS.excellent;
  if (score >= 60) return HEALTH_COLORS.good;
  if (score >= 40) return HEALTH_COLORS.moderate;
  return HEALTH_COLORS.poor;
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bueno";
  if (score >= 40) return "Moderado";
  return "Poco saludable";
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
