export function OrderFulfillmentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      {/* 文档/订单 */}
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <polyline points='14 2 14 8 20 8' />

      {/* 复选标记 */}
      <polyline points='9 11 12 14 16 9' />

      {/* 包裹/箱子（履行） */}
      <path d='M8 17h8' />
      <path d='M8 19h5' />
    </svg>
  );
}

export function OrderFulfillmentIconAlt({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      {/* 包裹箱子 */}
      <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
      <polyline points='3.27 6.96 12 12.01 20.73 6.96' />
      <line x1='12' y1='22.08' x2='12' y2='12' />

      {/* 内部复选标记 */}
      <polyline
        points='8 10 10.5 12.5 16 7'
        stroke='currentColor'
        strokeWidth='1.5'
      />
    </svg>
  );
}

export function OrderFulfillmentIconSimple({
  className
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      {/* 齿轮（生产/执行） */}
      <circle cx='12' cy='12' r='3' />
      <path d='M12 1v6m0 6v6m4.22-10.22l1.42-1.42m-1.42 8.84l1.42 1.42M18 12h6m-6 0h-6m-4.22-1.78l-1.42-1.42m1.42 8.84l-1.42 1.42M6 12H0' />

      {/* 中心的订单符号 */}
      <circle cx='12' cy='12' r='1' fill='currentColor' />
    </svg>
  );
}

export function OrderFulfillmentProcess({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      {/* 流程图：订单 -> 处理 -> 完成 */}
      <circle cx='6' cy='12' r='2' />
      <circle cx='12' cy='12' r='2' />
      <circle cx='18' cy='12' r='2' />
      <path d='M8 12h2m4 0h2' />

      {/* 进度指示 */}
      <path d='M6 6v12m6-12v12m6-12v12' strokeDasharray='2 2' opacity='0.3' />
    </svg>
  );
}

export function OrderNetworkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      {/* 网络节点结构 */}
      <circle cx='12' cy='5' r='3' />
      <circle cx='4' cy='15' r='3' />
      <circle cx='20' cy='15' r='3' />

      {/* 连接线 */}
      <path d='M12 8v4m-5.5 0l3.5-2m5.5 2l-3.5-2' />

      {/* 中心节点 */}
      <circle cx='12' cy='15' r='2' fill='currentColor' />
    </svg>
  );
}
