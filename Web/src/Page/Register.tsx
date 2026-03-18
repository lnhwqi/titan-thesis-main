import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme, bp } from "../View/Theme"
import { emit } from "../Runtime/React"
import { navigateTo, toRoute } from "../Route"
import Button from "../View/Form/Button"
import InputText from "../View/Form/InputText"
import * as RegisterAction from "../Action/Register"
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
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>
          Register as a user or seller. Seller accounts require admin approval.
        </p>

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
            <span className={styles.fieldLabel}>Name</span>
            <InputText
              value={register.name}
              invalid={showError("name")}
              type="text"
              placeholder={isSeller ? "Owner name" : "Your full name"}
              onChange={(v) => emit(RegisterAction.onChangeName(v))}
            />
            {showError("name") ? (
              <span className={styles.fieldError}>{errors.name}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <InputText
              value={register.email}
              invalid={showError("email")}
              type="email"
              placeholder="you@example.com"
              onChange={(v) => emit(RegisterAction.onChangeEmail(v))}
            />
            {showError("email") ? (
              <span className={styles.fieldError}>{errors.email}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <InputText
              value={register.password}
              invalid={showError("password")}
              type="password"
              placeholder="Min 8 chars"
              onChange={(v) => emit(RegisterAction.onChangePassword(v))}
            />
            {showError("password") ? (
              <span className={styles.fieldError}>{errors.password}</span>
            ) : null}
          </div>

          {isSeller ? (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Shop Name</span>
              <InputText
                value={register.shopName}
                invalid={showError("shopName")}
                type="text"
                placeholder="Your shop brand"
                onChange={(v) => emit(RegisterAction.onChangeShopName(v))}
              />
              {showError("shopName") ? (
                <span className={styles.fieldError}>{errors.shopName}</span>
              ) : null}
            </div>
          ) : null}

          {renderStatus(register.status)}

          <Button
            theme_={"Red"}
            size={"M"}
            label={
              isLoading
                ? "Submitting..."
                : isSeller
                  ? "Register Seller"
                  : "Register User"
            }
            onClick={() => emit(RegisterAction.onSubmit())}
            disabled={canSubmit === false}
          />
        </div>

        <button
          className={styles.loginLink}
          onClick={() => emit(navigateTo(toRoute("Login", { redirect: null })))}
        >
          Already have account? Go to login
        </button>
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
  container: css({
    width: "100dvw",
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.s6,
    background: `linear-gradient(120deg, ${color.secondary100}, ${color.neutral0}, ${color.secondary200})`,
  }),
  card: css({
    width: "100%",
    maxWidth: "540px",
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
    background: color.neutral0,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.s4,
    boxShadow: theme.elevation.large,
    padding: `${theme.s7} ${theme.s6}`,
    ...bp.sm({
      padding: `${theme.s10} ${theme.s9}`,
    }),
  }),
  title: css({
    ...font.boldH3_29,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular14,
    color: color.neutral700,
    margin: 0,
  }),
  roleToggle: css({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.s2,
  }),
  roleButton: css({
    ...font.medium14,
    border: `1px solid ${color.secondary200}`,
    background: color.neutral0,
    color: color.secondary500,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
  }),
  roleButtonActive: css({
    ...font.medium14,
    border: `1px solid ${color.secondary500}`,
    background: color.secondary500,
    color: color.neutral0,
    borderRadius: theme.s2,
    padding: `${theme.s2} ${theme.s3}`,
    cursor: "pointer",
  }),
  form: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
  }),
  field: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s1,
  }),
  fieldLabel: css({
    ...font.regular14,
  }),
  errorText: css({
    ...font.medium14,
    color: color.semantics.error.red500,
  }),
  fieldError: css({
    ...font.regular12,
    color: color.semantics.error.red500,
  }),
  successText: css({
    ...font.medium14,
    color: color.semantics.success.green500,
  }),
  loginLink: css({
    border: "none",
    background: "none",
    cursor: "pointer",
    ...font.medium14,
    color: color.secondary500,
    textDecoration: "underline",
    textAlign: "left",
    padding: 0,
  }),
}
