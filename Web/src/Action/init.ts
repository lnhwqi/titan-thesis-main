import { Action, cmd, Cmd } from "../Action"
import * as ProfileApi from "../Api/Auth/Profile"
import * as ProductApi from "../Api/Public/Product"
import { State } from "../State"
import {_ProductState} from "../State/ProductList"
import * as AuthToken from "../App/AuthToken"
import { onUrlChange } from "./Route"
import { initAuthState } from "../State/init"
import * as RD from "../../../Core/Data/RemoteData"


export function initCmd(): Cmd {
  const authToken = AuthToken.get()
  return authToken == null ? initPublicCmd() : initAuthCmd()
}


function initPublicCmd(): Cmd {
  return cmd(ProductApi.call({}).then(productResponse))
}

function initAuthCmd(): Cmd {
  return  cmd(ProfileApi.call().then(profileResponse))
}


function profileResponse(response: ProfileApi.Response): Action {
  return (state: State) => {
    if (response._t === "Err") {
      return [{ ...state, _t: "Public" }, cmd()]
    }

    const authState = initAuthState(response.value.user, state)

    return onUrlChange(authState)
  }
}


function productResponse(response: ProductApi.Response): Action {
  return (state: State) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, { listResponse: RD.failure(response.error) }),
        cmd()
      ]
    }

    return [
      _ProductState(state, { listResponse: RD.success(response.value) }),
      cmd()
    ]
  }
}