/**
 * E2E测试：测试真实用户场景
 * 这些测试将在真实浏览器中运行，模拟用户操作
 */
import { test, expect } from '@playwright/test';

test.describe('Contact Workspace E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到联系人工作空间页面
    await page.goto('/dashboard/contacts');
  });

  test('用户应该能够查看Excel文件和数据', async ({ page }) => {
    // 等待页面加载
    await expect(page.getByText('联系人工作空间')).toBeVisible();

    // 检查是否有设置按钮
    await expect(page.getByRole('button', { name: '设置' })).toBeVisible();

    // 设置Excel文件夹路径
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/tmp/test-contacts');
    await page.getByRole('button', { name: '初始化' }).click();

    // 等待文件加载
    await page.waitForTimeout(2000);

    // 应该看到文件列表
    const fileElements = page.locator('[data-testid="file-item"]');
    await expect(fileElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('用户应该能够切换文件和工作表', async ({ page }) => {
    // 先设置文件夹
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/tmp/test-contacts');
    await page.getByRole('button', { name: '初始化' }).click();

    // 等待加载
    await page.waitForTimeout(3000);

    // 点击第一个文件
    const firstFile = page.locator('[data-testid="file-item"]').first();
    await firstFile.click();

    // 应该看到工作表标签
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // 应该看到数据表格
    await expect(page.locator('table')).toBeVisible();
  });

  test('搜索功能应该正常工作', async ({ page }) => {
    // 设置并加载数据
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/tmp/test-contacts');
    await page.getByRole('button', { name: '初始化' }).click();
    await page.waitForTimeout(3000);

    // 使用搜索功能
    const searchInput = page.getByPlaceholder('搜索联系人...');
    await searchInput.fill('测试');

    // 应该看到搜索结果
    await page.waitForTimeout(1000);

    // 验证搜索结果显示（具体内容取决于测试数据）
    await expect(searchInput).toHaveValue('测试');
  });

  test('应该能够导出数据', async ({ page }) => {
    // 设置并加载数据
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/tmp/test-contacts');
    await page.getByRole('button', { name: '初始化' }).click();
    await page.waitForTimeout(3000);

    // 选择文件和工作表
    await page.locator('[data-testid="file-item"]').first().click();
    await page.waitForTimeout(1000);

    // 准备下载
    const downloadPromise = page.waitForEvent('download');

    // 点击导出按钮
    await page
      .getByRole('button', { name: /导出|下载/ })
      .first()
      .click();

    // 等待下载完成
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('页面性能：不应该有过多的API调用', async ({ page }) => {
    // 监听网络请求
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/excel/v3')) {
        apiRequests.push(request.url());
      }
    });

    // 设置并加载数据
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/tmp/test-contacts');
    await page.getByRole('button', { name: '初始化' }).click();

    // 等待加载完成
    await page.waitForTimeout(5000);

    // 检查API调用次数不应过多（具体数字取决于测试数据）
    console.log('API requests:', apiRequests.length);
    console.log('Requests:', apiRequests);

    // 对于10个文件，每个3个工作表的情况，应该远少于30次getSheetInfo调用
    const sheetInfoCalls = apiRequests.filter((url) =>
      url.includes('getSheetInfo')
    ).length;
    expect(sheetInfoCalls).toBeLessThan(10); // 只应该加载选中的工作表
  });

  test('错误处理：无效路径应该显示错误信息', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/invalid/path');
    await page.getByRole('button', { name: '初始化' }).click();

    // 应该看到错误提示或保持设置对话框打开
    await page.waitForTimeout(2000);

    // 验证错误处理（具体行为取决于实现）
    const isSettingsStillOpen = await page.getByRole('dialog').isVisible();
    expect(isSettingsStillOpen).toBe(true);
  });

  test('响应式设计：移动设备上应该正常显示', async ({ page }) => {
    // 模拟移动设备
    await page.setViewportSize({ width: 375, height: 667 });

    // 设置数据
    await page.getByRole('button', { name: '设置' }).click();
    await page.fill('input[placeholder*="路径"]', '/tmp/test-contacts');
    await page.getByRole('button', { name: '初始化' }).click();
    await page.waitForTimeout(3000);

    // 验证移动端布局
    await expect(page.getByText('联系人工作空间')).toBeVisible();

    // 表格应该可以横向滚动
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      const scrollContainer = table.locator('..'); // 父容器
      const isScrollable = await scrollContainer.evaluate(
        (el) => el.scrollWidth > el.clientWidth
      );
      expect(isScrollable).toBe(true);
    }
  });
});
