import { Separator } from '@/components/ui/separator';

export default function FontTestPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>字体测试</h1>
        <p className='text-muted-foreground'>
          测试思源黑体（Noto Sans SC）字体在订单履行管理系统中的显示效果
        </p>
      </div>
      <Separator />

      <div className='space-y-8'>
        {/* 字体检测 */}
        <div className='bg-card text-card-foreground rounded-lg border shadow-sm'>
          <div className='p-6'>
            <h3 className='mb-3 text-lg font-semibold'>当前字体检测</h3>
            <div className='space-y-2'>
              <p className='text-muted-foreground text-sm'>
                应用字体:{' '}
                <span className='bg-muted rounded px-2 py-1 font-mono text-xs'>
                  Noto Sans SC
                </span>
              </p>
              <p className='text-muted-foreground text-sm'>
                检查方法: 打开浏览器开发者工具 → Elements → Computed →
                font-family
              </p>
            </div>
          </div>
        </div>

        {/* 字重测试 */}
        <div className='bg-card text-card-foreground rounded-lg border shadow-sm'>
          <div className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>字重测试</h3>
            <div className='space-y-3'>
              <div className='flex items-center space-x-4'>
                <span className='text-muted-foreground w-16 text-sm'>
                  Light
                </span>
                <p className='font-light'>企业级数据管理平台 - 轻体显示效果</p>
              </div>
              <div className='flex items-center space-x-4'>
                <span className='text-muted-foreground w-16 text-sm'>
                  Regular
                </span>
                <p className='font-normal'>企业级数据管理平台 - 常规显示效果</p>
              </div>
              <div className='flex items-center space-x-4'>
                <span className='text-muted-foreground w-16 text-sm'>
                  Medium
                </span>
                <p className='font-medium'>企业级数据管理平台 - 中等显示效果</p>
              </div>
              <div className='flex items-center space-x-4'>
                <span className='text-muted-foreground w-16 text-sm'>Bold</span>
                <p className='font-bold'>企业级数据管理平台 - 粗体显示效果</p>
              </div>
            </div>
          </div>
        </div>

        {/* 字号测试 */}
        <div className='bg-card text-card-foreground rounded-lg border shadow-sm'>
          <div className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>字号测试</h3>
            <div className='space-y-4'>
              <p className='text-xs'>
                极小字号 (12px): 后台管理系统数据统计面板
              </p>
              <p className='text-sm'>小字号 (14px): 后台管理系统数据统计面板</p>
              <p className='text-base'>
                基础字号 (16px): 后台管理系统数据统计面板
              </p>
              <p className='text-lg'>大字号 (18px): 后台管理系统数据统计面板</p>
              <p className='text-xl'>
                超大字号 (20px): 后台管理系统数据统计面板
              </p>
              <p className='text-2xl'>
                标题字号 (24px): 后台管理系统数据统计面板
              </p>
            </div>
          </div>
        </div>

        {/* 中英混排测试 */}
        <div className='bg-card text-card-foreground rounded-lg border shadow-sm'>
          <div className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>订单履行专业术语</h3>
            <div className='space-y-2'>
              <p>Order Fulfillment 订单履行管理</p>
              <p>Supply Chain 供应链管理</p>
              <p>Procurement 采购管理</p>
              <p>Inventory Management 库存管理</p>
              <p>Delivery Tracking 交付跟踪</p>
              <p>Vendor Management 供应商管理</p>
              <p>SLA Monitoring 服务水平协议监控</p>
              <p>Purchase Order 采购订单 (PO)</p>
            </div>
          </div>
        </div>

        {/* 订单履行业务场景 */}
        <div className='bg-card text-card-foreground rounded-lg border shadow-sm'>
          <div className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>订单履行业务场景</h3>
            <div className='space-y-2'>
              <p>
                <strong>订单编号:</strong> OFD202408060001
              </p>
              <p>
                <strong>客户名称:</strong> 华为技术有限公司
              </p>
              <p>
                <strong>采购产品:</strong> 工业级网络交换机 48端口千兆 +
                4端口万兆
              </p>
              <p>
                <strong>交付地址:</strong> 深圳市龙岗区华为基地研发中心
              </p>
              <p>
                <strong>计划交付:</strong> 2024年08月20日 09:00:00
              </p>
              <p>
                <strong>供应商:</strong> 深圳市网络设备有限公司
              </p>
              <p>
                <strong>履行状态:</strong>
                <span className='ml-2'>
                  <span className='mr-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800'>
                    待采购
                  </span>
                  <span className='mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                    已下单
                  </span>
                  <span className='mr-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800'>
                    生产中
                  </span>
                  <span className='mr-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800'>
                    待发货
                  </span>
                  <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800'>
                    已交付
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
