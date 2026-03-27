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
import { gradient } from "../View/Theme/Keyframe"
import Button from "../View/Form/Button"
import { parseNotValidate } from "../State/Login"
import { navigateTo, toRoute } from "../Route"
import { ErrorEmail } from "../../../Core/Data/User/Email"
import { passwordErrorString } from "../../../Core/App/User/Password"

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
    background: `linear-gradient(-45deg, ${color.secondary400}, ${color.secondary100}, ${color.secondary400})`,
    backgroundSize: `400% 400%`,
    animation: `${gradient} 10s ease infinite`,
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
    background: color.secondary50,
    ...bp.sm({
      height: "auto",
      padding: `${theme.s12} ${theme.s20}`,
      borderRadius: theme.s4,
      border: `${theme.s0_25} solid ${color.secondary100}`,
      boxShadow: theme.elevation.large,
    }),
  }),
  pageTitle: css({
    ...font.regularH1_42,
  }),
  responseError: css({
    ...font.medium14,
    color: color.semantics.error.red500,
  }),
  responseLoading: css({
    ...font.medium14,
    color: color.neutral600,
  }),
  responseSuccess: css({
    ...font.medium14,
    color: color.semantics.success.green500,
  }),
  announcementCard: css({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: theme.s2,
    padding: theme.s3,
    borderRadius: theme.s2,
    border: `1px solid ${color.secondary300}`,
    background: color.secondary50,
  }),
  announcementTitle: css({
    ...font.bold14,
    color: color.secondary500,
  }),
  announcementBody: css({
    ...font.regular14,
    color: color.neutral800,
  }),
  announcementClose: css({
    width: "fit-content",
    border: `1px solid ${color.secondary400}`,
    borderRadius: theme.s2,
    background: color.neutral0,
    color: color.secondary500,
    ...font.medium12,
    padding: `${theme.s1} ${theme.s3}`,
    cursor: "pointer",
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
  }),
  fieldError: css({
    ...font.regular12,
    color: color.semantics.error.red500,
  }),
  registerLink: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    ...font.medium14,
    color: color.secondary500,
    textDecoration: "underline",
    padding: 0,
  }),
  divider: css({
    width: "100%",
    height: "1px",
    background: color.secondary100,
  }),
  sellerLink: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    ...font.regular14,
    color: color.neutral600,
    textDecoration: "underline",
    padding: 0,
  }),
}
