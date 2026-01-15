import { Category } from "../../../Core/App/Category"
import { CategoryRow } from "../Database/CategoryRow"

export function toCategory(categoryRow: CategoryRow): Category {
  return {
    id: categoryRow.id,
    name: categoryRow.name,
    slug: categoryRow.slug,
    children: [],
  }
}

/**
 import * as JD from "decoders"
 import { Name, nameDecoder } from "./Category/Name"
 import { CategoryID, categoryIDDecoder } from "./Category/CategoryID"
 import { Slug, slugDecoder } from "./Category/Slug"
 
 export type Category = {
   id: CategoryID
   name: Name
   slug: Slug
   children: Category[]
 }
 
 export const categoryDecoder: JD.Decoder<Category> = JD.object({
   id: categoryIDDecoder,
   name: nameDecoder,
   slug: slugDecoder,
   children: JD.array(JD.lazy(() => categoryDecoder)),
 })
 
 */
