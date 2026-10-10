import { test as base, expect } from '@playwright/test'

/**
 * Every test runs offline: PokeAPI and the GitHub-hosted sprites are mocked, so CI never
 * depends on (or loads) external services. Detail sections show their error states; artwork
 * shows placeholders. The squad features under test use only the bundled index.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://pokeapi.co/**', (route) =>
      route.fulfill({ status: 404, body: 'Not Found' }),
    )
    await page.route('https://raw.githubusercontent.com/**', (route) =>
      route.fulfill({ status: 404 }),
    )
    await use(page)
  },
})

export { expect }
