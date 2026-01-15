import * as JD from "decoders"
import { Name, nameDecoder } from "./Product/Name"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { Price, priceDecoder } from "./Product/Price"
import { ImageUrl, imageUrlDecoder } from "./Product/ProductImageUrl"
import { CategoryID, categoryIDDecoder } from "./Category/CategoryID"

export type BasicProduct = {
  id: ProductID
  name: Name
  price: Price
  url?: ImageUrl
  categoryIDs: CategoryID[]
}

export const basicProductDecoder: JD.Decoder<BasicProduct> = JD.object({
  id: productIDDecoder,
  name: nameDecoder,
  price: priceDecoder,
  url: JD.optional(imageUrlDecoder),
  categoryIDs: JD.array(categoryIDDecoder),
})
