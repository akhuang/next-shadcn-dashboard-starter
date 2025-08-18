'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ContactWorkspace from '@/features/contacts/components/contact-workspace';

export default function EmbedContactsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 添加嵌入式样式
    document.body.classList.add('embed-mode');

    // 如果有查询参数，自动触发搜索
    if (query) {
      // 延迟一下确保组件已渲染
      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[type="search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.value = query;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));

          // 触发搜索
          const searchForm = searchInput.closest('form');
          if (searchForm) {
            searchForm.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        }
      }, 100);
    }

    return () => {
      document.body.classList.remove('embed-mode');
    };
  }, [query]);

  if (!mounted) {
    return null;
  }

  return (
    <div className='embed-container'>
      <ContactWorkspace />

      <style jsx global>{`
        /* 嵌入模式样式 - 隐藏头部和侧边栏 */
        .embed-mode {
          overflow: hidden;
        }

        .embed-mode header,
        .embed-mode nav,
        .embed-mode aside,
        .embed-mode .sidebar,
        .embed-mode [data-sidebar],
        .embed-mode .navbar,
        .embed-mode .breadcrumb {
          display: none !important;
        }

        .embed-container {
          width: 100vw;
          height: 100vh;
          padding: 0;
          margin: 0;
          background: white;
        }

        /* 调整工作区样式 */
        .embed-mode main {
          margin: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
        }

        .embed-mode .contact-workspace {
          height: 100vh;
          border-radius: 0;
        }

        /* 优化搜索框样式 */
        .embed-mode .contact-search-overlay {
          top: 0;
          border-radius: 0;
        }

        /* 添加关闭按钮（可选） */
        .embed-close-btn {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
        }

        .embed-close-btn:hover {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
}
