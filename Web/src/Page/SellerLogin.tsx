import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import * as LoginAction from "../Action/Login"
import * as FieldString from "../../../Core/Data/Form/FieldString"
import InputText from "../View/Form/InputText"
import Button from "../View/Form/Button"
import { gradient } from "../View/Theme/Keyframe"
import * as LoginSellerApi from "../Api/Public/LoginSeller"
import { toRoute, navigateTo } from "../Route"

export type Props = { state: State }

export default function SellerLoginPage(props: Props): JSX.Element {
  const { email, password, loginResponse } = props.state.login
  const sellerParams = parseSellerParams(props.state.login)
  const isSubmitting = loginResponse._t === "Loading"

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.badge}>Seller Portal</div>
        <h1 className={styles.pageTitle}>Seller Login</h1>
        {responseMessage(loginResponse)}

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
            <span className={styles.fieldLabel}>Email</span>
            <InputText
              value={email.unwrap()}
              invalid={FieldString.error(email) != null}
              type="email"
              placeholder="seller@shop.com"
              onChange={(value) => emit(LoginAction.onChangeEmail(value))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <InputText
              value={password.unwrap()}
              invalid={FieldString.error(password) != null}
              type="password"
              placeholder="Your seller password"
              onChange={(value) => emit(LoginAction.onChangePassword(value))}
            />
          </div>

          <Button
            theme_={"Red"}
            size={"M"}
            label={isSubmitting ? "Signing in..." : "Sign In As Seller"}
            onClick={() => {
              if (isSubmitting == false && sellerParams != null) {
                emit(LoginAction.onSubmitSeller(sellerParams))
              }
            }}
            disabled={isSubmitting === true || sellerParams == null}
          />
        </form>

        <div className={styles.links}>
          <button
            className={styles.linkButton}
            onClick={() =>
              emit(navigateTo(toRoute("Login", { redirect: null })))
            }
          >
            Go to user login
          </button>
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
  container: css({
    width: "100dvw",
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: `linear-gradient(140deg, ${color.secondary300}, ${color.secondary100}, ${color.neutral0})`,
    backgroundSize: "220% 220%",
    animation: `${gradient} 9s ease infinite`,
    padding: theme.s6,
  }),
  wrapper: css({
    width: "100%",
    maxWidth: "480px",
    borderRadius: theme.s4,
    padding: `${theme.s8} ${theme.s6}`,
    background: "rgba(255,255,255,0.96)",
    boxShadow: theme.elevation.large,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s4,
    ...bp.sm({
      padding: `${theme.s10} ${theme.s10}`,
    }),
  }),
  badge: css({
    ...font.bold12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: color.secondary500,
  }),
  pageTitle: css({
    ...font.boldH1_42,
    margin: 0,
    lineHeight: 1.1,
  }),
  form: css({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  fieldLabel: css({
    ...font.regular14,
    color: color.neutral700,
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
  links: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s1,
  }),
  linkButton: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    ...font.medium14,
    color: color.secondary500,
    textDecoration: "underline",
  }),
}
