import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as LoginAction from "../Action/Login"
import * as FieldString from "../../../Core/Data/Form/FieldString"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import { fadeSlideUp } from "../View/Theme/Keyframe"
import * as LoginSellerApi from "../Api/Public/LoginSeller"
import { localImage } from "../View/ImageLocalSrc"
import { navigateTo, toRoute } from "../Route"

export type Props = { state: State }

export default function SellerLoginPage(props: Props): JSX.Element {
  const { email, password, loginResponse } = props.state.login
  const sellerParams = parseSellerParams(props.state.login)
  const isSubmitting = loginResponse._t === "Loading"
  const emailError =
    FieldString.error(email) != null ? "Enter a valid email address." : null
  const passwordError =
    FieldString.error(password) != null
      ? "Password must meet the required format."
      : null

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

      {/* ── Right: Auth form ── */}
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
            <span className={styles.formBadge}>Seller Portal</span>
            <h2 className={styles.formTitle}>Seller Sign In</h2>
          </div>

          {loginResponse._t !== "NotAsked" ? (
            <div className={styles.responseSlot}>
              {responseMessage(loginResponse)}
            </div>
          ) : null}

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault()
              if (isSubmitting == false && sellerParams != null) {
                emit(LoginAction.onSubmitSeller(sellerParams))
              }
            }}
          >
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email address</label>
              <InputText
                value={email.unwrap()}
                invalid={FieldString.error(email) != null}
                type="email"
                placeholder="seller@shop.com"
                onChange={(value) => emit(LoginAction.onChangeEmail(value))}
              />
              <span
                className={`${styles.fieldError} ${emailError == null ? styles.fieldErrorGhost : ""}`}
              >
                {emailError ?? "\u00A0"}
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Password</label>
              <InputText
                value={password.unwrap()}
                invalid={FieldString.error(password) != null}
                type="password"
                placeholder="••••••••"
                onChange={(value) => emit(LoginAction.onChangePassword(value))}
              />
              <span
                className={`${styles.fieldError} ${passwordError == null ? styles.fieldErrorGhost : ""}`}
              >
                {passwordError ?? "\u00A0"}
              </span>
            </div>

            <Button
              theme_={"Red"}
              size={"M"}
              label={isSubmitting ? "Signing in..." : "Sign In as Seller"}
              onClick={() => {
                if (isSubmitting == false && sellerParams != null) {
                  emit(LoginAction.onSubmitSeller(sellerParams))
                }
              }}
              disabled={isSubmitting === true || sellerParams == null}
            />
          </form>

          <div className={styles.footerLinks}>
            <button
              type="button"
              className={styles.textLink}
              onClick={() => emit(navigateTo(toRoute("Register", {})))}
            >
              Create New Account
            </button>
            <span className={styles.footerDot}>·</span>
            <button
              type="button"
              className={styles.textLink}
              onClick={() =>
                emit(navigateTo(toRoute("Login", { redirect: null })))
              }
            >
              Login as User
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
function parseSellerParams(
  login: State["login"],
): LoginSellerApi.BodyParams | null {
  const email = FieldString.value(login.email)
  const password = FieldString.value(login.password)
  if (email == null || password == null) {
    return null
  }

  const decoded = LoginSellerApi.paramsDecoder.decode({
    email: email.unwrap(),
    password: password.unwrap(),
  })

  return decoded.ok ? decoded.value : null
}

function responseMessage(
  response: State["login"]["loginResponse"],
): JSX.Element {
  switch (response._t) {
    case "NotAsked":
      return <></>
    case "Loading":
      return (
        <div className={styles.responseLoading}>Authenticating seller...</div>
      )
    case "Failure":
      return (
        <div className={styles.responseError}>
          Invalid seller credentials or account is pending approval.
        </div>
      )
    case "Success":
      return (
        <div className={styles.responseSuccess}>
          Login success. Redirecting to seller dashboard...
        </div>
      )
  }
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
      "linear-gradient(145deg, #1A0533 0%, #4C1D95 55%, #1A0533 100%)",
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
    background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
    clipPath: "polygon(0 0, 100% 0, 84% 100%, 0 100%)",
    boxShadow: "0 0 24px rgba(124,58,237,0.5)",
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
    maxWidth: "520px",
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
    maxWidth: "360px",
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
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: theme.s6,
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
  responseSlot: css({
    width: "100%",
  }),
  responseError: css({
    ...font.regular13,
    color: color.semantics.error.red500,
    background: color.semantics.error.red50,
    border: `1px solid rgba(237,28,36,0.15)`,
    borderRadius: "8px",
    padding: `${theme.s2} ${theme.s3}`,
  }),
  responseLoading: css({
    ...font.regular13,
    color: color.neutral500,
    textAlign: "center",
  }),
  responseSuccess: css({
    ...font.regular13,
    color: color.semantics.success.green500,
    background: color.semantics.success.green50,
    borderRadius: "8px",
    padding: `${theme.s2} ${theme.s3}`,
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
  fieldError: css({
    ...font.regular12,
    color: color.semantics.error.red500,
    minHeight: "18px",
    lineHeight: 1.4,
  }),
  fieldErrorGhost: css({
    visibility: "hidden",
  }),
  footerLinks: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s2,
  }),
  footerDot: css({
    color: color.neutral300,
    fontSize: "16px",
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
