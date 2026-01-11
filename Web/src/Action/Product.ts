import { Action, cmd } from "../Action"
import { _ProductState } from "../State/ProductList" 
import * as ProductApi from "../Api/Public/Product"
import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"


export function onChangeSearch(value: string): Action {
  return (state) => {
    return [
      _ProductState(state, { searchQuery: value }),
      cmd(),
    ]
  }
}

export function fetchAll(params: ProductApi.UrlParams): Action {
  return (state) => {
    return [
      _ProductState(state, { listResponse: RD.loading() }),
      
      cmd(ProductApi.call(params).then(onFetchResponse)),
    ]
  }
}


function onFetchResponse(response: ProductApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, {
          listResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }


    const listResponse: RD.RemoteData<ApiError<ProductApi.ErrorCode>, ProductApi.Payload> = 
      RD.success(response.value)

    return [
      _ProductState(state, {
        listResponse: listResponse,
      }),
      cmd(),
    ]
  }
}