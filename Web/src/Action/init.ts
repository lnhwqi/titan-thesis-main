import { Action, cmd, Cmd } from "../Action"
import * as ProfileApi from "../Api/Auth/Profile"
import * as ProductApi from "../Api/Public/Product"
import { State } from "../State"
import {_ProductState} from "../Action/Product"
import * as AuthToken from "../App/AuthToken"
import { onUrlChange } from "./Route"
import { initAuthState } from "../State/init"
import * as RD from "../../../Core/Data/RemoteData"

/**
 * Điểm khởi đầu của ứng dụng.
 */
export function initCmd(): Cmd {
  const authToken = AuthToken.get()
  return authToken == null ? initPublicCmd() : initAuthCmd()
}

/**
 * Luồng cho khách: Chỉ lấy 500 sản phẩm.
 */
function initPublicCmd(): Cmd {
  return cmd(ProductApi.call({}).then(productResponse))
}

/**
 * Luồng cho thành viên: Lấy cả Profile và 500 sản phẩm cùng lúc.
 */
function initAuthCmd(): Cmd {
  return [
    cmd(ProfileApi.call().then(profileResponse)),
    cmd(ProductApi.call({}).then(productResponse)) // Đảm bảo User đăng nhập cũng thấy hàng
  ]
}

/**
 * Xử lý phản hồi Profile tương tự như logic bạn muốn.
 */
function profileResponse(response: ProfileApi.Response): Action {
  return (state: State) => {
    if (response._t === "Err") {
      return [{ ...state, _t: "Public" }, cmd()]
    }

    // initAuthState(user, state) sẽ giữ nguyên phần product đang có trong state cũ
    const authState = initAuthState(response.value.user, state)

    return onUrlChange(authState)
  }
}

/**
 * Xử lý phản hồi Product: Sạch sẽ, kiểm tra lỗi trước, success sau.
 */
function productResponse(response: ProductApi.Response): Action {
  return (state: State) => {
    // 1. Kiểm tra nếu có lỗi từ Backend
    if (response._t === "Err") {
      return [
        _ProductState(state, { listResponse: RD.failure(response.error) }),
        cmd()
      ]
    }

    // 2. Nếu thành công, đổ 500 sản phẩm vào đĩa RD.success
    return [
      _ProductState(state, { listResponse: RD.success(response.value) }),
      cmd()
    ]
  }
}