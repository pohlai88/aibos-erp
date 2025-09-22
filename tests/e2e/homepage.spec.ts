import { test, expect } from '@playwright/test';

test.describe('AI-BOS ERP Homepage', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: 'AI-BOS ERP' })).toBeVisible();
  });

  test('should display the phase badge', async ({ page }) => {
    await page.goto('/');
    
    // Check if the phase badge is visible
    await expect(page.getByText('Phase 1 - Platform Bootstrap')).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    
    // Check if all three feature cards are visible
    await expect(page.getByText('Modern Architecture')).toBeVisible();
    await expect(page.getByText('Enterprise Security')).toBeVisible();
    await expect(page.getByText('High Performance')).toBeVisible();
  });

  test('should display development status', async ({ page }) => {
    await page.goto('/');
    
    // Check if development status section is visible
    await expect(page.getByText('Development Status')).toBeVisible();
    
    // Check if all status items are visible
    await expect(page.getByText('Monorepo')).toBeVisible();
    await expect(page.getByText('Anti-Drift')).toBeVisible();
    await expect(page.getByText('CI/CD')).toBeVisible();
    await expect(page.getByText('Docker')).toBeVisible();
  });

  test('should have working buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check if buttons are visible and clickable
    const getStartedButton = page.getByRole('button', { name: 'Get Started' });
    const learnMoreButton = page.getByRole('button', { name: 'Learn More' });
    
    await expect(getStartedButton).toBeVisible();
    await expect(learnMoreButton).toBeVisible();
    
    // Test button interactions
    await getStartedButton.click();
    // Add assertions for button click behavior
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if content is still visible on mobile
    await expect(page.getByRole('heading', { name: 'AI-BOS ERP' })).toBeVisible();
    await expect(page.getByText('Phase 1 - Platform Bootstrap')).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    const h2 = page.getByRole('heading', { level: 2 });
    const h3 = page.getByRole('heading', { level: 3 });
    
    await expect(h1).toHaveCount(1);
    await expect(h2).toHaveCount(1);
    await expect(h3).toHaveCount(3);
    
    // Check for proper button roles
    const buttons = page.getByRole('button');
    await expect(buttons).toHaveCount(2);
  });
});
