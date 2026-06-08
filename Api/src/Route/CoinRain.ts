import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import { userAuthApi, adminAuthApi } from "../Api/AuthApi"
import * as GetCampaignPublic from "../Api/Public/CoinRain/GetCampaign"
import * as GetCampaignAdmin from "../Api/Auth/Admin/CoinRain/GetCampaign"
import * as UpsertCampaignAdmin from "../Api/Auth/Admin/CoinRain/UpsertCampaign"
import * as PickupCoinUser from "../Api/Auth/User/CoinRain/PickupCoin"
import * as ListMineUser from "../Api/Auth/User/CoinRain/ListMine"

export function coinRainRoutes(app: Express): void {
  publicApi(app, GetCampaignPublic)
  adminAuthApi(app, GetCampaignAdmin)
  adminAuthApi(app, UpsertCampaignAdmin)
  userAuthApi(app, PickupCoinUser)
  userAuthApi(app, ListMineUser)
}
