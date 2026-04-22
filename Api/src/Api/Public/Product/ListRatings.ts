import * as API from "../../../../../Core/Api/Public/Product/ListRatings"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as ProductRatingRow from "../../../Database/ProductRatingRow"
import { toProductRating } from "../../../App/ProductRating"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { productID } = params

  const ratings = await ProductRatingRow.getByProductId(productID)
  const mappedRatings = ratings.map(toProductRating)

  return ok({
    ratings: mappedRatings,
  })
}
