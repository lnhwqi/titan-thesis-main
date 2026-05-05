import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import { RemoteData } from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import * as LoginApi from "../Api/Public/LoginUser"
import * as LoginAction from "../Action/Login"
import * as RegisterAction from "../Action/Register"
import * as FieldString from "../../../Core/Data/Form/FieldString"
import InputText from "../View/Form/InputText"
import { gradient, glowPulse } from "../View/Theme/Keyframe"
import Button from "../View/Form/Button"
import { parseNotValidate } from "../State/Login"
import { navigateTo, toRoute } from "../Route"
import { ErrorEmail } from "../../../Core/Data/User/Email"
import { passwordErrorString } from "../../../Core/App/User/Password"
import { localImage } from "../View/ImageLocalSrc"

export type Props = { state: State }
export default function LoginPage(props: Props): JSX.Element {
  const { email, password, loginResponse } = props.state.login
  const registerStatus = props.state.register.status
  const hasAnnouncement = registerStatus._t === "Success"
  const loginParams = parseNotValidate(props.state.login)
  const isSubmitting = loginResponse._t === "Loading"
  const emailError = FieldString.error(email)
  const passwordError = FieldString.error(password)

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {hasAnnouncement ? (
          <div className={styles.announcementCard}>
            <div className={styles.announcementTitle}>Notice</div>
            <div className={styles.announcementBody}>
              {registerStatus.message}
            </div>
            <button
              className={styles.announcementClose}
              onClick={() => emit(RegisterAction.clearStatus())}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className={styles.logoRow}>
          <img
            src={localImage.logo.unwrap()}
            alt="Titan Logo"
            className={styles.logoImg}
          />
        </div>

        <div className={styles.pageTitle}>Login</div>
        <p className={styles.pageSubtitle}>Titan Ecommercial Platform</p>

        <div className={styles.responseSlot}>
          {responseMessage(loginResponse)}
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault()
            if (isSubmitting == false && loginParams != null) {
              emit(LoginAction.onSubmit(loginParams))
            }
          }}
        >
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <InputText
              value={email.unwrap()}
              invalid={emailError != null}
              type="email"
              placeholder="Enter email"
              onChange={(value) => emit(LoginAction.onChangeEmail(value))}
            />
            <span
              className={`${styles.fieldError} ${emailError == null ? styles.fieldErrorGhost : ""}`}
            >
              {emailError != null ? emailErrorMessage(emailError) : "\u00A0"}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <InputText
              value={password.unwrap()}
              invalid={passwordError != null}
              type="password"
              placeholder="Enter password"
              onChange={(value) => emit(LoginAction.onChangePassword(value))}
            />
            <span
              className={`${styles.fieldError} ${passwordError == null ? styles.fieldErrorGhost : ""}`}
            >
              {passwordError != null
                ? passwordErrorString(passwordError)
                : "\u00A0"}
            </span>
          </div>
          <Button
            theme_={"Red"}
            size={"M"}
            label={isSubmitting ? "Submitting..." : "Submit"}
            onClick={() => {
              if (isSubmitting == false && loginParams != null) {
                emit(LoginAction.onSubmit(loginParams))
              }
            }}
            disabled={isSubmitting === true || loginParams == null}
          />

          <button
            type="button"
            className={styles.registerLink}
            onClick={() => emit(navigateTo(toRoute("Register", {})))}
          >
            New here? Create account
          </button>

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.sellerLink}
            onClick={() => emit(navigateTo(toRoute("SellerLogin", {})))}
          >
            Login As Seller
          </button>
        </form>
      </div>
    </div>
  )
}

function responseMessage(
  response: RemoteData<ApiError<LoginApi.ErrorCode>, LoginApi.Payload>,
): JSX.Element {
  switch (response._t) {
    case "NotAsked":
      return <></>
    case "Loading":
      return <div className={styles.responseLoading}>Logging you in...</div>
    case "Failure":
      return (
        <div className={styles.responseError}>
          {LoginApi.errorString(response.error)}
        </div>
      )
    case "Success":
      return (
        <div className={styles.responseSuccess}>
          Login Success! Redirecting you now...
        </div>
      )
  }
}

function emailErrorMessage(_error: ErrorEmail): string {
  return "Enter a valid email address."
}

const styles = {
  container: css({
    width: "100%",
    maxWidth: "100%",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflowX: "hidden",
    padding: `${theme.s4} ${theme.s3}`,
    boxSizing: "border-box",
    background: `linear-gradient(-45deg, ${color.secondary500}, ${color.secondary400}, ${color.primary400}, ${color.primary500}, ${color.secondary500})`,
    backgroundSize: `400% 400%`,
    animation: `${gradient} 12s ease infinite`,
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.14) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(241, 248, 255, 0.18) 0%, transparent 45%)",
      pointerEvents: "none",
    },
    ...bp.sm({
      padding: `${theme.s6} ${theme.s5}`,
    }),
  }),
  wrapper: css({
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    gap: theme.s4,
    padding: `${theme.s6} ${theme.s4}`,
    borderRadius: theme.s5,
    border: `1px solid rgba(255, 255, 255, 0.18)`,
    background: "rgba(255, 255, 255, 0.10)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    boxShadow:
      "0 24px 64px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)",
    position: "relative",
    zIndex: 1,
    ...bp.sm({
      maxWidth: "500px",
      padding: `${theme.s7} ${theme.s6}`,
    }),
  }),
  pageTitle: css({
    ...font.boldH3_29,
    color: color.neutral0,
    margin: 0,
    textAlign: "center",
    letterSpacing: "-0.5px",
    textShadow: "0 2px 12px rgba(0, 82, 156, 0.22)",
  }),
  pageSubtitle: css({
    ...font.regular14,
    margin: 0,
    marginTop: `-${theme.s2}`,
    textAlign: "center",
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.6,
  }),
  logoRow: css({
    display: "flex",
    justifyContent: "center",
    marginBottom: theme.s1,
  }),
  logoImg: css({
    width: "64px",
    height: "64px",
    objectFit: "contain",
    borderRadius: "50%",
    border: `2px solid rgba(255, 255, 255, 0.3)`,
    boxShadow: "0 8px 24px rgba(0, 82, 156, 0.28)",
    animation: `${glowPulse} 3s ease-in-out infinite`,
  }),
  responseSlot: css({
    minHeight: theme.s12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  }),
  responseError: css({
    ...font.medium14,
    color: color.genz.coral,
    background: "rgba(255, 107, 107, 0.15)",
    padding: `${theme.s2} ${theme.s3}`,
    borderRadius: theme.br2,
    border: `1px solid rgba(255, 107, 107, 0.3)`,
    textAlign: "center",
    width: "100%",
  }),
  responseLoading: css({
    ...font.medium14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  }),
  responseSuccess: css({
    ...font.medium14,
    color: color.genz.lime,
    textAlign: "center",
  }),
  announcementCard: css({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    padding: theme.s3,
    borderRadius: theme.s2,
    border: `1px solid rgba(255,255,255,0.15)`,
    background: "rgba(255,255,255,0.08)",
  }),
  announcementTitle: css({
    ...font.bold14,
    color: color.neutral0,
  }),
  announcementBody: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.8)",
  }),
  announcementClose: css({
    width: "fit-content",
    border: `1px solid rgba(255,255,255,0.3)`,
    borderRadius: theme.s2,
    background: "rgba(255,255,255,0.1)",
    color: color.neutral0,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    transition: "background 0.18s ease",
    "&:hover": {
      background: "rgba(255,255,255,0.2)",
    },
  }),
  form: css({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    gap: theme.s4,
  }),
  field: css({
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  fieldLabel: css({
    ...font.regular14,
    color: "rgba(255,255,255,0.9)",
  }),
  fieldError: css({
    ...font.regular12,
    color: color.genz.coral,
    minHeight: theme.s4,
    display: "block",
    lineHeight: 1.4,
  }),
  fieldErrorGhost: css({
    visibility: "hidden",
  }),
  registerLink: css({
    border: `1px solid rgba(255,255,255,0.24)`,
    borderRadius: theme.br2,
    background: "rgba(255,255,255,0.08)",
    cursor: "pointer",
    ...font.medium14,
    color: color.neutral0,
    textDecoration: "none",
    padding: `${theme.s2} ${theme.s3}`,
    transition: "opacity 0.2s ease, background 0.2s ease, transform 0.2s ease",
    "&:hover": {
      opacity: 1,
      transform: "translateY(-1px)",
      background: "rgba(255,255,255,0.16)",
    },
  }),
  divider: css({
    width: "100%",
    height: "1px",
    background: "rgba(255,255,255,0.12)",
  }),
  sellerLink: css({
    border: "none",
    background: "transparent",
    cursor: "pointer",
    ...font.regular14,
    color: "rgba(255,255,255,0.74)",
    textDecoration: "underline",
    padding: 0,
    transition: "color 0.2s ease",
    "&:hover": {
      color: "rgba(255,255,255,0.96)",
    },
  }),
}
