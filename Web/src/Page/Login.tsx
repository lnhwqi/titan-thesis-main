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

        {responseMessage(loginResponse)}

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
            {emailError != null ? (
              <span className={styles.fieldError}>
                {emailErrorMessage(emailError)}
              </span>
            ) : null}
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
            {passwordError != null ? (
              <span className={styles.fieldError}>
                {passwordErrorString(passwordError)}
              </span>
            ) : null}
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
            Seller? Login here
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
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    overflowX: "hidden",
    background: `linear-gradient(-45deg, #0F0F1A, #1A1A2E, #7C3AED, #EC4899, #0F0F1A)`,
    backgroundSize: `400% 400%`,
    animation: `${gradient} 12s ease infinite`,
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 30% 60%, rgba(124, 58, 237, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(236, 72, 153, 0.2) 0%, transparent 45%)",
      pointerEvents: "none",
    },
    ...bp.sm({
      alignItems: "center",
    }),
  }),
  wrapper: css({
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s4,
    padding: `${theme.s0} ${theme.s6}`,
    background: "rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    position: "relative",
    zIndex: 1,
    ...bp.sm({
      height: "auto",
      padding: `${theme.s12} ${theme.s20}`,
      borderRadius: theme.s6,
      border: `1px solid rgba(255, 255, 255, 0.15)`,
      boxShadow:
        "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
    }),
  }),
  pageTitle: css({
    ...font.boldH3_29,
    color: color.neutral0,
    letterSpacing: "-0.5px",
    textShadow: "0 2px 12px rgba(124, 58, 237, 0.4)",
  }),
  logoRow: css({
    display: "flex",
    justifyContent: "center",
    marginBottom: theme.s2,
  }),
  logoImg: css({
    width: "64px",
    height: "64px",
    objectFit: "contain",
    borderRadius: "50%",
    border: `2px solid rgba(255, 255, 255, 0.3)`,
    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.5)",
    animation: `${glowPulse} 3s ease-in-out infinite`,
  }),
  responseError: css({
    ...font.medium14,
    color: color.genz.coral,
    background: "rgba(255, 107, 107, 0.15)",
    padding: `${theme.s2} ${theme.s3}`,
    borderRadius: theme.br2,
    border: `1px solid rgba(255, 107, 107, 0.3)`,
  }),
  responseLoading: css({
    ...font.medium14,
    color: "rgba(255,255,255,0.7)",
  }),
  responseSuccess: css({
    ...font.medium14,
    color: color.genz.lime,
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
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.s4,
  }),
  field: css({
    minWidth: theme.s82,
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
  }),
  registerLink: css({
    border: "none",
    cursor: "pointer",
    ...font.medium14,
    background: color.genz.gradientPurplePink,
    color: color.neutral0,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textDecoration: "none",
    padding: 0,
    transition: "opacity 0.2s ease",
    "&:hover": {
      opacity: 0.8,
    },
  }),
  divider: css({
    width: "100%",
    height: "1px",
    background: "rgba(255,255,255,0.12)",
  }),
  sellerLink: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    ...font.regular14,
    color: "rgba(255,255,255,0.5)",
    textDecoration: "underline",
    padding: 0,
    transition: "color 0.2s ease",
    "&:hover": {
      color: "rgba(255,255,255,0.8)",
    },
  }),
}
