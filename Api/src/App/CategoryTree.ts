import { Category } from "../../../Core/App/Category"
import { CategoryRow } from "../Database/CategoryRow" // Import Type từ file DB
import { toCategory } from "./Category" // Import hàm toCategory bạn vừa gửi

export function buildCategoryTree(rows: CategoryRow[]): Category[] {
  const categoryMap = new Map<string, Category>()
  const roots: Category[] = []

  rows.forEach((row) => {
    const idString = row.id.unwrap()
    categoryMap.set(idString, toCategory(row))
  })
  rows.forEach((row) => {
    const idString = row.id.unwrap()
    const currentCategory = categoryMap.get(idString)

    if (!currentCategory) return
    if (row.parentId == null) {
      roots.push(currentCategory)
    } else {
      const parentIdString = row.parentId.unwrap()
      const parentCategory = categoryMap.get(parentIdString)

      if (parentCategory) {
        parentCategory.children.push(currentCategory)
      } else {
        roots.push(currentCategory)
      }
    }
  })

  return roots
}
