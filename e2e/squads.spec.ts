import { expect, test } from './fixtures'

test('search, add to a squad, share it, and save the shared copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')

  // Search and add: the first add creates "Squad 1".
  await page.getByLabel('Search').fill('char')
  await page.getByRole('button', { name: 'Add Charizard to a new squad' }).click()
  await expect(page.getByTestId('announcer')).toHaveText('Added Charizard to Squad 1')

  await page.getByLabel('Search').fill('gengar')
  await page.getByRole('button', { name: 'Add Gengar to Squad 1' }).click()

  // The tray leads to the squad, which shows its analysis.
  await page.getByRole('link', { name: 'Current squad: Squad 1, 2 of 6' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Squad 1' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Uncovered types' })).toBeVisible()

  // Share: the copied link opens a read-only view in a fresh page.
  await page.getByRole('button', { name: 'Copy share link' }).click()
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toMatch(/\/squad\?m=6,94&n=Squad\+1$/)

  const shared = await context.newPage()
  await shared.route('https://pokeapi.co/**', (route) => route.fulfill({ status: 404 }))
  await shared.goto(link)
  await expect(shared.getByText('Shared with you')).toBeVisible()
  await shared.getByRole('button', { name: 'Save as my squad' }).click()
  await expect(shared.getByRole('button', { name: 'Rename' })).toBeVisible()

  await shared.goto('/squads')
  await expect(shared.getByRole('list').getByRole('link')).toHaveCount(2)
})

test('squads survive a reload', async ({ page }) => {
  await page.goto('/?q=pikachu')
  await page.getByRole('button', { name: 'Add Pikachu to a new squad' }).click()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Current squad: Squad 1, 1 of 6' })).toBeVisible()
})

test('a squad page has no horizontal scroll at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?q=char')
  for (const name of ['Charmander', 'Charmeleon', 'Charizard']) {
    await page.getByRole('button', { name: new RegExp(`^Add ${name} to`) }).click()
  }
  await page.getByRole('link', { name: /^Current squad/ }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText('Squad 3/6')).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBe(0)
})
