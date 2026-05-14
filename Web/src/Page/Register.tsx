import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import Button from "../View/Form/Button"
import InputText from "../View/Form/InputText"
import * as RegisterAction from "../Action/Register"
import { fadeSlideUp } from "../View/Theme/Keyframe"
import {
  createNameE as createUserNameE,
  ErrorName as ErrorUserName,
} from "../../../Core/App/User/Name"
import { createEmailE, ErrorEmail } from "../../../Core/Data/User/Email"
import {
  passwordErrors,
  passwordErrorString,
} from "../../../Core/App/User/Password"
import {
  createShopNameE,
  ErrorShopName,
} from "../../../Core/App/Seller/ShopName"
import { localImage } from "../View/ImageLocalSrc"

export type Props = { state: State }

export default function RegisterPage(props: Props): JSX.Element {
  const { register } = props.state
  const isSeller = register.role === "SELLER"
  const isLoading = register.status._t === "Loading"
  const errors = getRegisterErrors(register)
  const hasErrors = Object.values(errors).some((msg) => msg != null)
  const showError = (field: keyof typeof register.touched) =>
    register.touched[field] && errors[field] != null
  const canSubmit = !isLoading && hasErrors === false

  return (
    <div className={styles.page}>
      {/* ── Left: Brand hero ── */}
      <div className={styles.brand}>
        <div className={styles.brandBadge}>
          <span className={styles.brandBadgeText}>TITAN</span>
        </div>
        <div className={styles.brandGrid} />
        <div className={styles.brandContent}>
          <img
            src={localImage.logo.unwrap()}
            alt="Titan logo"
            className={styles.brandLogoImg}
          />
        </div>
      </div>

      {/* ── Right: Registration form ── */}
      <div className={styles.auth}>
        <div className={styles.authInner}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => emit(navigateTo(toRoute("Home", {})))}
          >
            X
          </button>

          <div className={styles.formHeader}>
            <span className={styles.formBadge}>Get Started</span>
            <h2 className={styles.formTitle}>Create Account</h2>
          </div>

          <div className={styles.roleToggle}>
            <button
              className={
                register.role === "USER"
                  ? styles.roleButtonActive
                  : styles.roleButton
              }
              onClick={() => emit(RegisterAction.onChangeRole("USER"))}
            >
              User
            </button>
            <button
              className={
                register.role === "SELLER"
                  ? styles.roleButtonActive
                  : styles.roleButton
              }
              onClick={() => emit(RegisterAction.onChangeRole("SELLER"))}
            >
              Seller
            </button>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Full name</label>
              <InputText
                value={register.name}
                invalid={showError("name")}
                type="text"
                placeholder={isSeller ? "Owner name" : "Your full name"}
                onChange={(v) => emit(RegisterAction.onChangeName(v))}
              />
              <span
                className={`${styles.fieldError} ${showError("name") ? "" : styles.fieldErrorGhost}`}
              >
                {showError("name") ? errors.name : "\u00A0"}
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email address</label>
              <InputText
                value={register.email}
                invalid={showError("email")}
                type="email"
                placeholder="you@example.com"
                onChange={(v) => emit(RegisterAction.onChangeEmail(v))}
              />
              <span
                className={`${styles.fieldError} ${showError("email") ? "" : styles.fieldErrorGhost}`}
              >
                {showError("email") ? errors.email : "\u00A0"}
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Password</label>
              <InputText
                value={register.password}
                invalid={showError("password")}
                type="password"
                placeholder="Min 8 characters"
                onChange={(v) => emit(RegisterAction.onChangePassword(v))}
              />
              <span
                className={`${styles.fieldError} ${showError("password") ? "" : styles.fieldErrorGhost}`}
              >
                {showError("password") ? errors.password : "\u00A0"}
              </span>
            </div>

            {isSeller ? (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Shop name</label>
                <InputText
                  value={register.shopName}
                  invalid={showError("shopName")}
                  type="text"
                  placeholder="Your shop brand"
                  onChange={(v) => emit(RegisterAction.onChangeShopName(v))}
                />
                <span
                  className={`${styles.fieldError} ${showError("shopName") ? "" : styles.fieldErrorGhost}`}
                >
                  {showError("shopName") ? errors.shopName : "\u00A0"}
                </span>
              </div>
            ) : null}

            <div className={styles.responseSlot}>
              {renderStatus(register.status)}
            </div>

            <Button
              theme_={"Red"}
              size={"M"}
              label={
                isLoading
                  ? "Submitting..."
                  : isSeller
                    ? "Register as Seller"
                    : "Create Account"
              }
              onClick={() => emit(RegisterAction.onSubmit())}
              disabled={canSubmit === false}
            />
          </div>

          <div className={styles.footerLinks}>
            <button
              type="button"
              className={styles.textLink}
              onClick={() =>
                emit(navigateTo(toRoute("Login", { redirect: null })))
              }
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderStatus(status: State["register"]["status"]): JSX.Element {
  switch (status._t) {
    case "Idle":
    case "Loading":
      return <></>
    case "Error":
      return <div className={styles.errorText}>{status.message}</div>
    case "Success":
      return <div className={styles.successText}>{status.message}</div>
  }
}

type RegisterErrors = Record<keyof State["register"]["touched"], string | null>

function getRegisterErrors(register: State["register"]): RegisterErrors {
  const trimmedName = register.name.trim()
  const trimmedEmail = register.email.trim().toLowerCase()
  const passwordIssues = passwordErrors(register.password)
  const trimmedShopName = register.shopName.trim()

  return {
    name:
      trimmedName === ""
        ? "Name is required."
        : userNameError(createUserNameE(trimmedName)),
    email:
      trimmedEmail === ""
        ? "Email is required."
        : emailError(createEmailE(trimmedEmail)),
    password:
      register.password.trim() === ""
        ? "Password is required."
        : passwordIssues.length === 0
          ? null
          : passwordErrorString(passwordIssues[0]),
    shopName:
      register.role === "SELLER"
        ? trimmedShopName === ""
          ? "Shop name is required for sellers."
          : shopNameError(createShopNameE(trimmedShopName))
        : null,
  }
}

function userNameError(
  result: ReturnType<typeof createUserNameE>,
): string | null {
  return result._t === "Err" ? mapUserNameError(result.error) : null
}

function emailError(result: ReturnType<typeof createEmailE>): string | null {
  return result._t === "Err" ? mapEmailError(result.error) : null
}

function shopNameError(
  result: ReturnType<typeof createShopNameE>,
): string | null {
  return result._t === "Err" ? mapShopNameError(result.error) : null
}

function mapUserNameError(_error: ErrorUserName): string {
  return "Name must be between 1 and 100 characters."
}

function mapEmailError(_error: ErrorEmail): string {
  return "Enter a valid email address."
}

function mapShopNameError(_error: ErrorShopName): string {
  return "Shop name must be between 1 and 100 characters."
}

const styles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    ...bp.md({
      flexDirection: "row",
    }),
  }),
  brand: css({
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: `${theme.s10} ${theme.s8}`,
    background:
      "linear-gradient(145deg, #0F172A 0%, #312E81 55%, #0F172A 100%)",
    minHeight: "220px",
    ...bp.md({
      flex: "0 0 60%",
      minHeight: "100dvh",
      padding: `${theme.s16} ${theme.s14}`,
    }),
  }),
  brandGrid: css({
    position: "absolute",
    inset: 0,
    backgroundImage: [
      "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
      "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
    ].join(", "),
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  }),
  brandBadge: css({
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 3,
    width: "180px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #312E81 0%, #7C3AED 100%)",
    clipPath: "polygon(0 0, 100% 0, 84% 100%, 0 100%)",
    boxShadow: "0 0 24px rgba(124,58,237,0.45)",
  }),
  brandBadgeText: css({
    ...font.bold14,
    color: color.neutral0,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    transform: "skewX(-8deg)",
  }),
  brandContent: css({
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    ...bp.md({
      alignItems: "center",
    }),
  }),
  brandLogoImg: css({
    width: "100%",
    maxWidth: "min(100%, 520px)",
    minWidth: "120px",
    aspectRatio: "1 / 1",
    objectFit: "contain",
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.08)",
    padding: theme.s4,
    flexShrink: 0,
  }),
  brandWordmark: css({
    fontSize: "clamp(2.4rem, 5vw, 4rem)",
    fontFamily: 'var(--font-sans, "SF Pro Display", "Inter", sans-serif)',
    fontWeight: 800,
    letterSpacing: "-0.05em",
    lineHeight: 1,
    margin: 0,
    background:
      "linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.65) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }),
  brandTagline: css({
    margin: 0,
    ...font.regular17,
    color: "rgba(255,255,255,0.50)",
    letterSpacing: "0.01em",
    maxWidth: "min(100%, 360px)",
  }),
  brandFeatures: css({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "none",
    flexDirection: "column",
    gap: theme.s3,
    ...bp.md({
      display: "flex",
    }),
    "& li": {
      ...font.regular13,
      color: "rgba(255,255,255,0.55)",
      paddingLeft: "22px",
      position: "relative",
      "&::before": {
        content: '"✦"',
        position: "absolute",
        left: 0,
        color: color.genz.purpleLight,
        fontSize: "9px",
        top: "5px",
      },
    },
  }),
  brandFootnote: css({
    position: "relative",
    zIndex: 1,
    margin: 0,
    ...font.regular12,
    color: "rgba(255,255,255,0.20)",
    display: "none",
    ...bp.md({
      display: "block",
    }),
  }),
  auth: css({
    flex: "0 0 40%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color.neutral0,
    padding: `${theme.s10} ${theme.s8}`,
    ...bp.md({
      overflowY: "auto",
      minHeight: "100dvh",
    }),
  }),
  authInner: css({
    position: "relative",
    width: "100%",
    maxWidth: "min(100%, 380px)",
    display: "flex",
    flexDirection: "column",
    gap: theme.s5,
    paddingTop: theme.s7,
    animation: `${fadeSlideUp} 0.45s ease both`,
  }),
  closeButton: css({
    position: "absolute",
    top: 0,
    right: 0,
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: `1px solid ${color.neutral200}`,
    background: color.neutral0,
    color: color.neutral700,
    ...font.bold12,
    cursor: "pointer",
    "&:hover": {
      background: color.neutral50,
      borderColor: color.neutral300,
    },
  }),
  formHeader: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
  }),
  formBadge: css({
    ...font.bold12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: color.genz.purple,
  }),
  formTitle: css({
    margin: 0,
    ...font.boldH2_35,
    color: color.neutral900,
  }),
  formSubtitle: css({
    margin: 0,
    ...font.regular13,
    color: color.neutral500,
  }),
  roleToggle: css({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.s2,
  }),
  roleButton: css({
    ...font.medium14,
    border: `1px solid ${color.neutral100}`,
    background: color.neutral0,
    color: color.neutral600,
    borderRadius: "8px",
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
    transition: "border-color 160ms ease",
    "&:hover": {
      borderColor: color.genz.purpleLight,
    },
  }),
  roleButtonActive: css({
    ...font.medium14,
    border: `1px solid ${color.genz.purple}`,
    background: color.genz.purple,
    color: color.neutral0,
    borderRadius: "8px",
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
  }),
  form: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: theme.s2,
  }),
  fieldLabel: css({
    ...font.medium14,
    color: color.neutral700,
  }),
  responseSlot: css({
    minHeight: theme.s8,
    display: "flex",
    alignItems: "center",
    width: "100%",
  }),
  errorText: css({
    ...font.regular13,
    color: color.semantics.error.red500,
    background: color.semantics.error.red50,
    border: `1px solid rgba(237,28,36,0.15)`,
    borderRadius: "8px",
    padding: `${theme.s2} ${theme.s3}`,
    width: "100%",
  }),
  fieldError: css({
    ...font.regular12,
    color: color.semantics.error.red500,
    minHeight: "18px",
    lineHeight: 1.4,
  }),
  fieldErrorGhost: css({
    visibility: "hidden",
  }),
  successText: css({
    ...font.regular13,
    color: color.semantics.success.green500,
    background: color.semantics.success.green50,
    borderRadius: "8px",
    padding: `${theme.s2} ${theme.s3}`,
    width: "100%",
  }),
  footerLinks: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }),
  textLink: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    ...font.regular13,
    color: color.genz.purple,
    padding: 0,
    "&:hover": {
      textDecoration: "underline",
    },
  }),
}
