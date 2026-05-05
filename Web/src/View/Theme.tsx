import { css } from "@emotion/css"
import { Breakpoint } from "./Theme/Breakpoint"
import { Color } from "./Theme/Color"
import { Font } from "./Theme/Font"
import { Space } from "./Theme/Space"

export const bp = Breakpoint
export const color = Color
export const font = Font
export const space = Space

/** A giant object that contains all the theme values */
export const theme = {
  ...space,
  bp,
  color,
  font,
}

export const appThemeClass = css({
  "--app-bg": Color.secondary10,
  "--app-bg-elevated": Color.neutral0,
  "--app-surface": "rgba(255, 255, 255, 0.84)",
  "--app-surface-strong": "rgba(255, 255, 255, 0.96)",
  "--app-surface-muted": Color.secondary20,
  "--app-border": Color.secondary100,
  "--app-border-strong": Color.secondary200,
  "--app-shadow-xs": "0 4px 12px rgba(0, 82, 156, 0.06)",
  "--app-shadow-sm": "0 12px 32px rgba(0, 82, 156, 0.10)",
  "--app-shadow-md": "0 18px 48px rgba(0, 82, 156, 0.14)",
  "--app-shadow-lg": "0 28px 72px rgba(0, 82, 156, 0.18)",
  "--app-text": Color.neutral800,
  "--app-text-soft": Color.neutral600,
  "--app-text-muted": Color.neutral500,
  "--app-accent": Color.secondary500,
  "--app-accent-soft": "rgba(0, 82, 156, 0.08)",
  "--app-accent-contrast": Color.neutral0,
  "--app-brand-500": Color.secondary500,
  "--app-brand-400": Color.secondary400,
  "--app-brand-300": Color.secondary300,
  "--app-brand-200": Color.secondary200,
  "--app-brand-100": Color.secondary100,
  "--app-brand-50": Color.secondary50,
  "--app-brand-20": Color.secondary20,
  "--app-secondary-500": Color.primary500,
  "--app-secondary-400": Color.primary400,
  "--app-secondary-300": Color.primary300,
  "--app-secondary-200": Color.primary200,
  "--app-secondary-100": Color.primary100,
  "--app-secondary-50": Color.primary50,
  "--app-secondary-20": Color.primary20,
  "--app-success-500": Color.semantics.success.green500,
  "--app-success-50": Color.semantics.success.green50,
  "--app-success-20": Color.semantics.success.green20,
  "--app-error-500": Color.semantics.error.red500,
  "--app-error-50": Color.semantics.error.red50,
  "--app-error-20": Color.semantics.error.red20,
  "--app-warning-500": Color.semantics.warning.orange500,
  "--app-warning-50": Color.semantics.warning.orange50,
  "--app-warning-20": Color.semantics.warning.orange20,
  "--app-info-500": Color.semantics.info.blue500,
  "--app-info-50": Color.semantics.info.blue50,
  "--app-info-20": Color.semantics.info.blue20,
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.9), transparent 30%), radial-gradient(circle at 90% 12%, rgba(0, 82, 156, 0.10), transparent 26%), linear-gradient(180deg, var(--app-bg) 0%, #eef5fb 100%)",
  color: "var(--app-text)",
  fontFamily:
    '"SF Pro Display", "Inter", "Segoe UI", "Helvetica Neue", sans-serif',
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  textRendering: "optimizeLegibility",
  "& *, & *::before, & *::after": {
    boxSizing: "border-box",
  },
  "& button, & a, & input, & select, & textarea": {
    transition:
      "background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease, opacity 180ms ease",
  },
  "& button, & [role='button'], & a": {
    WebkitTapHighlightColor: "transparent",
  },
  "& button:focus-visible, & a:focus-visible, & input:focus-visible, & select:focus-visible, & textarea:focus-visible":
    {
      outline: "none",
      boxShadow: "0 0 0 4px rgba(0, 82, 156, 0.16)",
    },
})

export const layoutSize = { maxWidth: 1240 }
