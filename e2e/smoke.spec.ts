import { expect, test } from '@playwright/test'
import path from 'node:path'

// Fake rules, not real game data. Costs follow the rulebook formula.
const rulesFile = path.join(import.meta.dirname, 'fixtures', 'fake-rules.json')

test('create a warband, add two models, see the total, and keep it after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Import rules' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Import rules' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Import rules' })
  await dialog.getByTestId('rules-file-input').setInputFiles(rulesFile)
  await expect(dialog.getByText('2 rules ready to import')).toBeVisible()
  await dialog.getByRole('button', { name: 'Import rules' }).click()
  await expect(page.getByText('2 special rules')).toBeVisible()

  await page.getByRole('link', { name: 'Warbands' }).click()
  await page.getByRole('button', { name: 'New warband' }).first().click()
  await page.getByLabel('Name').fill('Smoke test band')
  await page.getByRole('button', { name: 'Create warband' }).click()
  await expect(page.getByRole('heading', { name: 'Smoke test band' })).toBeVisible()

  const points = page.getByRole('region', { name: 'Points' })
  await expect(points).toContainText('0')

  // Default profile Quality 4+ Combat 2: ((2 × 5) × 3) / 2 = 15 points.
  await page.getByRole('button', { name: 'Add model' }).click()
  await page.getByLabel('Name').fill('Grunt')
  await page.getByRole('button', { name: 'Save model' }).click()
  await expect(points).toContainText('15')

  // Quality 3+ Combat 4 with Hops (7) and Bossy (10): ((20 + 17) × 4) / 2 = 74 points.
  await page.getByRole('button', { name: 'Add model' }).click()
  await page.getByLabel('Name').fill('Boss')
  await page.getByRole('radio', { name: 'Quality 3+' }).click()
  await page.getByRole('radio', { name: 'Combat 4' }).click()
  await page.getByRole('button', { name: 'Add special rules' }).click()
  await page.getByRole('option', { name: /Hops/ }).click()
  await page.getByRole('option', { name: /Bossy/ }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: 'Save model' }).click()

  await expect(points).toContainText('89')
  await expect(page.getByText('Warband is ready to play.')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Smoke test band' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Grunt' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Boss' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Boss' })).toContainText('Leader')
  await expect(page.getByRole('region', { name: 'Points' })).toContainText('89')
})
