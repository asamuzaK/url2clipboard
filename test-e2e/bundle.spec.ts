/**
 * test-e2e/bundle.spec.ts
 */
import { test, expect } from './fixtures.js';

test.describe('Chrome Bundle E2E Tests', () => {
  test('Background Service Worker starts successfully', async ({
    context,
    extensionId
  }) => {
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    expect(sw).toBeDefined();

    // Verify that the Service Worker is running without errors
    const isReady = await sw.evaluate(() => {
      return !!chrome.runtime.id;
    });
    expect(isReady).toBe(true);
  });

  test('Options page renders correctly', async ({ page, extensionId }) => {
    // Navigate to the extension's options page
    await page.goto(`chrome-extension://${extensionId}/html/options.html`);

    // Check if the body element is successfully loaded and visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('Options are saved to chrome.storage.local when changed', async ({
    page,
    extensionId,
    context
  }) => {
    const targetFormat = 'Markdown'; 

    // 1. Open the options page
    await page.goto(`chrome-extension://${extensionId}/html/options.html`);

    // 2. Locate the checkbox for Markdown by exact ID
    const checkbox = page.locator(`input#${targetFormat}`);

    // Ensure the checkbox is visible
    await expect(checkbox).toBeVisible();

    // 3. Toggle the checkbox
    const initialState = await checkbox.isChecked();
    await checkbox.click();
    const newState = !initialState;

    // 4. Verify the state in the UI
    expect(await checkbox.isChecked()).toBe(newState);

    // 5. Verify the state in chrome.storage.local via Service Worker
    const [background] = context.serviceWorkers();
    
    // Wait a moment for the storage write operation to complete
    await page.waitForTimeout(500); 

    const storedValue = await background.evaluate(async (key) => {
      const data = await chrome.storage.local.get(key);
      return data[key];
    }, targetFormat);

    // The extension stores the state as an object { checked: boolean }
    expect(storedValue.checked).toBe(newState);
  });

  test('Copies Markdown format to clipboard from popup', async ({
    page,
    extensionId,
    context
  }) => {
    // 1. Grant permissions globally
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 2. Open a dummy web page to be the target for copying
    const targetPage = await context.newPage();
    await targetPage.goto('https://example.com/');

    // Store the expected title and URL from the target web page
    const expectedTitle = await targetPage.title();
    const expectedUrl = targetPage.url();

    // 3. Open the popup page
    const extensionOrigin = `chrome-extension://${extensionId}`;
    await page.goto(`${extensionOrigin}/html/popup.html`);

    // 4. Expand the <details> element
    const details = page.locator('details#copyPageDetails');
    const isDetailsOpen = await details.evaluate(el => el.hasAttribute('open'));
    if (!isDetailsOpen) {
      await details.locator('summary').click();
    }

    // 5. Locate and click the Markdown copy button
    const copyButton = page.locator('button#copyPageURLMarkdown');
    await expect(copyButton).toBeVisible();

    // 6. Click and handle the page closing
    // The extension's logic will copy the "active tab" (example.com)
    await Promise.all([
      page.waitForEvent('close').catch(() => {}),
      copyButton.click()
    ]);

    // 7. Use targetPage to safely read the clipboard
    await targetPage.bringToFront();
    await targetPage.waitForTimeout(500);

    const clipboardText = await targetPage.evaluate(async () => {
      window.focus(); 
      return await navigator.clipboard.readText();
    });

    // 8. Verify the result matches the TARGET page's info
    const expectedMarkdown = `[${expectedTitle}](${expectedUrl})`;
    expect(clipboardText).toBe(expectedMarkdown);
  });
});
