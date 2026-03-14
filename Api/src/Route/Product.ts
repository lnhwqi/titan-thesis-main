import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import { sellerAuthApi } from "../Api/AuthApi"
import * as GetList from "../Api/Public/Product/ListAll"
import * as GetByID from "../Api/Public/Product/GetOne"
import * as Search from "../Api/Public/Product/Search"
import * as CreateProduct from "../Api/Auth/Product/create"
import * as UpdateProduct from "../Api/Auth/Product/update"
import * as DeleteProduct from "../Api/Auth/Product/delete"
export function productRoutes(app: Express): void {
  publicApi(app, GetList)
  publicApi(app, Search)
  publicApi(app, GetByID)

  sellerAuthApi(app, CreateProduct)
  sellerAuthApi(app, UpdateProduct)
  sellerAuthApi(app, DeleteProduct)
}
