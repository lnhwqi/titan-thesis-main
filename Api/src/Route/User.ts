import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as Login from "../Api/Public/User/Login"
import * as Register from "../Api/Public/User/Register"
import * as Logout from "../Api/Auth/User/Logout"
import * as Profile from "../Api/Auth/User/Profile"
import * as UpdateProfile from "../Api/Auth/User/UpdateProfile"
import * as RefreshToken from "../Api/Public/RefreshTokenUser"
import * as HomeUser from "../Api/Auth/User/HomeUser"
import * as WishlistList from "../Api/Auth/User/Wishlist/List"
import * as WishlistSave from "../Api/Auth/User/Wishlist/Save"
import * as WishlistRemove from "../Api/Auth/User/Wishlist/Remove"
import * as CartAdd from "../Api/Auth/User/Cart/Add"
import * as CartDelete from "../Api/Auth/User/Cart/Delete"
import * as CartUpdateQuantity from "../Api/Auth/User/Cart/UpdateQuantity"
import * as OrderPaymentCreate from "../Api/Auth/User/OrderPayment/Create"
import { userAuthApi } from "../Api/AuthApi"

export function userRoutes(app: Express): void {
  publicApi(app, Login)
  publicApi(app, RefreshToken)
  publicApi(app, Register)
  userAuthApi(app, Logout)
  userAuthApi(app, Profile)
  userAuthApi(app, UpdateProfile)
  userAuthApi(app, HomeUser)
  userAuthApi(app, WishlistList)
  userAuthApi(app, WishlistSave)
  userAuthApi(app, WishlistRemove)
  userAuthApi(app, CartAdd)
  userAuthApi(app, CartDelete)
  userAuthApi(app, CartUpdateQuantity)
  userAuthApi(app, OrderPaymentCreate)
}
