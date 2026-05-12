import { Action, cmd } from "../Action"
import {
  _UpdateProfileState,
  initUpdateProfileState,
} from "../State/UpdateProfile"
import * as FieldString from "../../../Core/Data/Form/FieldString"
import * as UpdateProfileApi from "../Api/Auth/User/UpdateProfile"
import * as RD from "../../../Core/Data/RemoteData"
import { _AuthUserState, AuthUserState } from "../State"

export function onChangeName(value: string): Action {
  return _AuthUserState((authState: AuthUserState) => {
    const { name } = authState.updateProfile
    return [
      _UpdateProfileState(authState, {
        name: FieldString.changeAndParse(value, name),
      }),
      cmd(),
    ]
  })
}

export function onChangeEmail(value: string): Action {
  return _AuthUserState((authState: AuthUserState) => {
    const { email } = authState.updateProfile
    return [
      _UpdateProfileState(authState, {
        email: FieldString.changeAndParse(value, email),
      }),
      cmd(),
    ]
  })
}

export function onChangeCurrentPassword(value: string): Action {
  return _AuthUserState((authState: AuthUserState) => {
    const { currentPassword } = authState.updateProfile
    return [
      _UpdateProfileState(authState, {
        currentPassword: FieldString.changeAndParse(value, currentPassword),
      }),
      cmd(),
    ]
  })
}

export function onChangeNewPassword(value: string): Action {
  return _AuthUserState((authState: AuthUserState) => {
    const { newPassword } = authState.updateProfile
    return [
      _UpdateProfileState(authState, {
        newPassword: FieldString.changeAndParse(value, newPassword),
      }),
      cmd(),
    ]
  })
}

export function onChangeConfirmPassword(value: string): Action {
  return _AuthUserState((authState: AuthUserState) => {
    const { confirmPassword } = authState.updateProfile
    return [
      _UpdateProfileState(authState, {
        confirmPassword: FieldString.changeAndParse(value, confirmPassword),
      }),
      cmd(),
    ]
  })
}

export function onSubmit(params: UpdateProfileApi.BodyParams): Action {
  return _AuthUserState((authState: AuthUserState) => {
    return [
      _UpdateProfileState(authState, { updateResponse: RD.loading() }),
      cmd(UpdateProfileApi.call(params).then(onSubmitResponse)),
    ]
  })
}

function onSubmitResponse(response: UpdateProfileApi.Response): Action {
  return _AuthUserState((authState: AuthUserState) => {
    if (response._t === "Err") {
      return [
        _UpdateProfileState(authState, {
          updateResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    const { user } = response.value
    return [
      _UpdateProfileState(
        { ...authState, profile: user },
        {
          ...initUpdateProfileState(user),
          updateResponse: RD.success(response.value),
        },
      ),
      cmd(),
    ]
  })
}
