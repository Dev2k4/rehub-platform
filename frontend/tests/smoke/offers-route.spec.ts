import { expect, test } from "@playwright/test"

test("redirect unauthenticated user from offers to login", async ({ page }) => {
  await page.goto("/offers")
  await expect(page).toHaveURL(/\/auth\/login/)
})

test("hide offers button on homepage for unauthenticated user", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Offers" })).toHaveCount(0)
})
