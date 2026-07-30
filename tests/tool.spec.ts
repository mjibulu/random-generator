import { expect, test } from "@playwright/test";
import { createExternalRequestGuard } from "../src/lib/network-guard";

test("number, password, and dice generation stay local", async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required.");
  const networkGuard = createExternalRequestGuard(baseURL);
  page.on("request", (request) => networkGuard.inspect(request.url()));

  await page.goto("/");
  await page.getByRole("spinbutton", { name: "Maximum" }).fill("3");
  await page.getByRole("spinbutton", { name: "How many" }).fill("3");
  await page
    .getByRole("checkbox", { name: "Do not repeat values" })
    .check();
  await page
    .getByRole("combobox", { name: "Result order" })
    .selectOption("ascending");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator(".random-result")).toHaveText("1\n2\n3");

  await page.getByRole("tab", { name: "Passwords" }).click();
  await page.getByRole("spinbutton", { name: "How many" }).fill("3");
  await page.getByRole("button", { name: "Generate" }).click();
  const passwords = (await page.locator(".random-result").innerText()).split("\n");
  expect(passwords).toHaveLength(3);
  expect(passwords.every((value) => value.length === 16)).toBe(true);

  await page.getByRole("tab", { name: "Dice" }).click();
  await page.getByRole("button", { name: "d20" }).click();
  await page.getByRole("spinbutton", { name: "Number of dice" }).fill("4");
  await page.getByRole("button", { name: "Generate" }).click();
  const rolls = (await page.locator(".random-result").innerText())
    .split("\n")
    .map(Number);
  expect(rolls).toHaveLength(4);
  expect(rolls.every((value) => value >= 1 && value <= 20)).toBe(true);

  networkGuard.assertNoExternalRequests();
});
