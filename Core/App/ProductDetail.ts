import * as JD from "decoders"
import { Name, nameDecoder } from "./Product/Name"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { Price, priceDecoder } from "./Product/Price"
import { Description, descriptionDecoder } from "./Product/Description"
import { ImageUrl, imageUrlDecoder } from "./Product/ProductImageUrl"
import { CategoryID, categoryIDDecoder } from "./Category/CategoryID"

export type DetailProduct = {
  id: ProductID
  name: Name
  price: Price
  description: Description
  urls: ImageUrl[]
  categoryIDs: CategoryID[]
}

export const productDecoder: JD.Decoder<DetailProduct> = JD.object({
  id: productIDDecoder,
  name: nameDecoder,
  price: priceDecoder,
  description: descriptionDecoder,
  urls: JD.array(imageUrlDecoder),
  categoryIDs: JD.array(categoryIDDecoder),
})
