import { Action, cmd, Cmd } from "../Action"
import { _AuthUserState, AuthUserState, State } from "../State"
import * as ProfileApi from "../Api/Auth/User/Profile"

// This onEnterRoute just for presentation purposes
export function onEnterRoute(authState: AuthUserState): [State, Cmd] {
  return [authState, cmd(ProfileApi.call().then(profileResponse))]
}

function profileResponse(response: ProfileApi.Response): Action {
  return _AuthUserState((authState: AuthUserState) => {
    return response._t === "Err"
      ? [authState, cmd()]
      : [{ ...authState, profile: response.value.user }, cmd()]
  })
}
