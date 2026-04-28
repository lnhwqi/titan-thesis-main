import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as Login from "../Api/Public/Admin/Login"
import * as Logout from "../Api/Auth/Admin/Logout"
import * as RefreshToken from "../Api/Public/RefreshTokenAdmin"
import * as HomeAdmin from "../Api/Auth/Admin/HomeAdmin"
import * as ListPendingSellers from "../Api/Auth/Admin/ListPendingSellers"
import * as ListAllSellers from "../Api/Auth/Admin/ListAllSellers"
import * as SendSellerVerifyEmail from "../Api/Auth/Admin/SendSellerVerifyEmail"
import * as ApproveSeller from "../Api/Auth/Admin/ApproveSeller"
import * as CreateCategory from "../Api/Auth/Admin/CreateCategory"
import * as UpdateCategory from "../Api/Auth/Admin/UpdateCategory"
import * as DeleteCategory from "../Api/Auth/Admin/DeleteCategory"
import * as ListPoster from "../Api/Auth/Admin/ListPoster"
import * as CreatePoster from "../Api/Auth/Admin/CreatePoster"
import * as UpdatePoster from "../Api/Auth/Admin/UpdatePoster"
import * as DeletePoster from "../Api/Auth/Admin/DeletePoster"
import * as UploadPosterImage from "../Api/Auth/Admin/UploadPosterImage"
import * as UpdateWallet from "../Api/Auth/Admin/UpdateWallet"
import * as OrderPaymentList from "../Api/Auth/Admin/OrderPayment/List"
import * as ReportList from "../Api/Auth/Admin/Report/List"
import * as ReportUpdateStatus from "../Api/Auth/Admin/Report/UpdateStatus"
import * as ReportWindowGet from "../Api/Auth/Admin/ReportWindow/Get"
import * as ReportWindowUpdate from "../Api/Auth/Admin/ReportWindow/Update"
import * as SellerTierPolicyGet from "../Api/Auth/Admin/SellerTierPolicy/Get"
import * as SellerTierPolicyUpdate from "../Api/Auth/Admin/SellerTierPolicy/Update"
import * as ProductRatingWindowGet from "../Api/Auth/Admin/ProductRatingWindow/Get"
import * as ProductRatingWindowUpdate from "../Api/Auth/Admin/ProductRatingWindow/Update"
import * as ProductRatingReportUpdateStatus from "../Api/Auth/Admin/ProductRatingReport/UpdateStatus"
import * as ProductRatingReportLimitGet from "../Api/Auth/Admin/ProductRatingReportLimit/Get"
import * as ProductRatingReportLimitUpdate from "../Api/Auth/Admin/ProductRatingReportLimit/Update"
import * as ProductRatingDelete from "../Api/Auth/Admin/ProductRating/Delete"
import * as Stats from "../Api/Auth/Admin/Stats"
import * as SupportAIMetrics from "../Api/Auth/Admin/SupportAIMetrics"
import { adminAuthApi } from "../Api/AuthApi"

export function adminRoutes(app: Express): void {
  publicApi(app, Login)
  publicApi(app, RefreshToken)
  adminAuthApi(app, Logout)
  adminAuthApi(app, HomeAdmin)
  adminAuthApi(app, Stats)
  adminAuthApi(app, SupportAIMetrics)
  adminAuthApi(app, ListPendingSellers)
  adminAuthApi(app, ListAllSellers)
  adminAuthApi(app, SendSellerVerifyEmail)
  adminAuthApi(app, ApproveSeller)
  adminAuthApi(app, CreateCategory)
  adminAuthApi(app, UpdateCategory)
  adminAuthApi(app, DeleteCategory)
  adminAuthApi(app, ListPoster)
  adminAuthApi(app, UploadPosterImage)
  adminAuthApi(app, CreatePoster)
  adminAuthApi(app, UpdatePoster)
  adminAuthApi(app, DeletePoster)
  adminAuthApi(app, UpdateWallet)
  adminAuthApi(app, OrderPaymentList)
  adminAuthApi(app, ReportList)
  adminAuthApi(app, ReportUpdateStatus)
  adminAuthApi(app, ReportWindowGet)
  adminAuthApi(app, ReportWindowUpdate)
  adminAuthApi(app, ProductRatingWindowGet)
  adminAuthApi(app, ProductRatingWindowUpdate)
  adminAuthApi(app, ProductRatingReportUpdateStatus)
  adminAuthApi(app, ProductRatingReportLimitGet)
  adminAuthApi(app, ProductRatingReportLimitUpdate)
  adminAuthApi(app, ProductRatingDelete)
  adminAuthApi(app, SellerTierPolicyGet)
  adminAuthApi(app, SellerTierPolicyUpdate)
}
