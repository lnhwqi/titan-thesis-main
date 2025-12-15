import * as JD from "decoders"
import { Name, nameDecoder } from "./Product/Name"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { Price, priceDecoder } from "./Product/Price"
import { Description, descriptionDecoder } from "./Product/Description"
import { ImageUrl, imageUrlDecoder } from "./Product/ProductImageUrl"

export type Product = {
  id: ProductID
  name: Name
  price: Price
  description: Description
  urls: ImageUrl[]
}

export const productDecoder: JD.Decoder<Product> = JD.object({
  id: productIDDecoder,
  name: nameDecoder,
  price: priceDecoder,
  description: descriptionDecoder,
  urls: JD.array(imageUrlDecoder),
})
