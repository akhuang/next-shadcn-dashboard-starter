import {
  LucideIcon,
  Globe,
  FileText,
  Database,
  Shield,
  Monitor,
  Users,
  Settings,
  Package,
  Gauge,
  Mail,
  Calendar,
  BarChart3,
  Lock,
  Bookmark,
  Activity,
  Layers,
  Bug,
  Search,
  Bell,
  Clipboard,
  Workflow,
  Archive,
  Image,
  Video,
  Download,
  Star,
  ExternalLink,
  Clock,
  Trash2
} from 'lucide-react';

export interface NavigationLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: LucideIcon;
  isExternal?: boolean;
}

export interface NavigationCategory {
  id: string;
  title: string;
  description?: string;
  links: NavigationLink[];
  icon?: LucideIcon;
}

export const frequentlyUsedLinks: NavigationLink[] = [
  {
    id: 'erp-system',
    title: 'ERP 系统',
    description: '企业资源规划核心系统',
    url: 'https://erp.company.com',
    icon: Database,
    isExternal: true
  },
  {
    id: 'wms-system',
    title: 'WMS 仓储',
    description: '仓库管理系统',
    url: 'https://wms.company.com',
    icon: Package,
    isExternal: true
  },
  {
    id: 'order-system',
    title: '订单管理',
    description: '订单履行和跟踪系统',
    url: 'https://orders.company.com',
    icon: Clipboard,
    isExternal: true
  },
  {
    id: 'supplier-portal',
    title: '供应商门户',
    description: '供应商管理平台',
    url: 'https://supplier.company.com',
    icon: Users,
    isExternal: true
  },
  {
    id: 'procurement',
    title: '采购系统',
    description: '采购申请和审批',
    url: 'https://procurement.company.com',
    icon: FileText,
    isExternal: true
  },
  {
    id: 'inventory-monitor',
    title: '库存监控',
    description: '实时库存状态监控',
    url: 'https://inventory.company.com',
    icon: Monitor,
    isExternal: true
  },
  {
    id: 'logistics-tracking',
    title: '物流跟踪',
    description: '运输状态实时跟踪',
    url: 'https://logistics.company.com',
    icon: Workflow,
    isExternal: true
  },
  {
    id: 'supply-analytics',
    title: '供应链分析',
    description: '供应链数据分析看板',
    url: 'https://analytics.company.com',
    icon: BarChart3,
    isExternal: true
  }
];

export const navigationCategories: NavigationCategory[] = [
  {
    id: 'supply-chain-core',
    title: '供应链核心',
    description: 'ERP、仓储、订单等核心业务系统',
    icon: Package,
    links: [
      {
        id: 'erp-main',
        title: 'ERP 系统',
        description: '企业资源规划系统',
        url: 'https://erp.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'wms-main',
        title: 'WMS 仓储系统',
        description: '仓库管理系统',
        url: 'https://wms.company.com',
        icon: Package,
        isExternal: true
      },
      {
        id: 'oms',
        title: '订单管理系统',
        description: '订单履行和跟踪',
        url: 'https://oms.company.com',
        icon: Clipboard,
        isExternal: true
      },
      {
        id: 'tms',
        title: '运输管理系统',
        description: '物流运输管理',
        url: 'https://tms.company.com',
        icon: Workflow,
        isExternal: true
      },
      {
        id: 'pim',
        title: '商品信息管理',
        description: '商品主数据管理',
        url: 'https://pim.company.com',
        icon: Archive,
        isExternal: true
      },
      {
        id: 'inventory',
        title: '库存管理',
        description: '库存监控和预警',
        url: 'https://inventory.company.com',
        icon: BarChart3,
        isExternal: true
      },
      {
        id: 'mrp-system',
        title: 'MRP 物料需求',
        description: '物料需求计划系统',
        url: 'https://mrp.company.com',
        icon: Settings,
        isExternal: true
      },
      {
        id: 'demand-planning',
        title: '需求计划',
        description: '需求预测和计划管理',
        url: 'https://demand.company.com',
        icon: Activity,
        isExternal: true
      }
    ]
  },
  {
    id: 'procurement',
    title: '采购管理',
    description: '供应商管理和采购流程',
    icon: Users,
    links: [
      {
        id: 'srm',
        title: 'SRM 供应商管理',
        description: '供应商关系管理系统',
        url: 'https://srm.company.com',
        icon: Users,
        isExternal: true
      },
      {
        id: 'procurement-system',
        title: '采购系统',
        description: '采购申请和审批流程',
        url: 'https://procurement.company.com',
        icon: Clipboard,
        isExternal: true
      },
      {
        id: 'vendor-portal',
        title: '供应商门户',
        description: '供应商自助服务平台',
        url: 'https://vendor.company.com',
        icon: Globe,
        isExternal: true
      },
      {
        id: 'contract-mgmt',
        title: '合同管理',
        description: '供应商合同管理系统',
        url: 'https://contract.company.com',
        icon: FileText,
        isExternal: true
      },
      {
        id: 'sourcing',
        title: '寻源管理',
        description: '供应商寻源和评估',
        url: 'https://sourcing.company.com',
        icon: Search,
        isExternal: true
      },
      {
        id: 'rfq-system',
        title: 'RFQ 报价系统',
        description: '请求报价管理',
        url: 'https://rfq.company.com',
        icon: BarChart3,
        isExternal: true
      },
      {
        id: 'po-management',
        title: '采购订单管理',
        description: '采购订单生成和跟踪',
        url: 'https://po.company.com',
        icon: Workflow,
        isExternal: true
      },
      {
        id: 'receiving',
        title: '收货管理',
        description: '采购收货和验收',
        url: 'https://receiving.company.com',
        icon: Package,
        isExternal: true
      }
    ]
  },
  {
    id: 'finance-accounting',
    title: '财务管理',
    description: '财务会计和成本管理',
    icon: BarChart3,
    links: [
      {
        id: 'finance-system',
        title: '财务系统',
        description: '会计核算和财务管理',
        url: 'https://finance.company.com',
        icon: BarChart3,
        isExternal: true
      },
      {
        id: 'ap-system',
        title: '应付管理',
        description: '供应商应付账款管理',
        url: 'https://ap.company.com',
        icon: Clipboard,
        isExternal: true
      },
      {
        id: 'cost-center',
        title: '成本中心',
        description: '成本分析和控制',
        url: 'https://cost.company.com',
        icon: Activity,
        isExternal: true
      },
      {
        id: 'budget-system',
        title: '预算管理',
        description: '预算编制和执行',
        url: 'https://budget.company.com',
        icon: BarChart3,
        isExternal: true
      },
      {
        id: 'invoice-system',
        title: '发票管理',
        description: '发票开具和管理',
        url: 'https://invoice.company.com',
        icon: FileText,
        isExternal: true
      },
      {
        id: 'payment-system',
        title: '支付管理',
        description: '供应商支付管理',
        url: 'https://payment.company.com',
        icon: Settings,
        isExternal: true
      }
    ]
  },
  {
    id: 'quality-compliance',
    title: '质量控制',
    description: '质量管理和合规性检查',
    icon: Shield,
    links: [
      {
        id: 'qms',
        title: '质量管理系统',
        description: 'ISO9001 质量管理体系',
        url: 'https://qms.company.com',
        icon: Shield,
        isExternal: true
      },
      {
        id: 'inspection',
        title: '质检系统',
        description: '进货质量检验管理',
        url: 'https://inspection.company.com',
        icon: Search,
        isExternal: true
      },
      {
        id: 'supplier-audit',
        title: '供应商审计',
        description: '供应商质量审计系统',
        url: 'https://audit.company.com',
        icon: Clipboard,
        isExternal: true
      },
      {
        id: 'compliance',
        title: '合规管理',
        description: '法规合规性检查',
        url: 'https://compliance.company.com',
        icon: Lock,
        isExternal: true
      },
      {
        id: 'certification',
        title: '认证管理',
        description: '产品认证和资质管理',
        url: 'https://cert.company.com',
        icon: Settings,
        isExternal: true
      },
      {
        id: 'capa-system',
        title: 'CAPA 管理',
        description: '纠正和预防措施管理',
        url: 'https://capa.company.com',
        icon: Bug,
        isExternal: true
      }
    ]
  },
  {
    id: 'analytics-reporting',
    title: '分析报表',
    description: '业务分析和报表系统',
    icon: Monitor,
    links: [
      {
        id: 'bi-dashboard',
        title: 'BI 看板',
        description: '供应链数据分析看板',
        url: 'https://bi.company.com',
        icon: Monitor,
        isExternal: true
      },
      {
        id: 'supply-analytics',
        title: '供应链分析',
        description: '供应链绩效分析报告',
        url: 'https://analytics.company.com',
        icon: BarChart3,
        isExternal: true
      },
      {
        id: 'inventory-report',
        title: '库存报表',
        description: '库存分析和周转报告',
        url: 'https://inventory-report.company.com',
        icon: Activity,
        isExternal: true
      },
      {
        id: 'procurement-report',
        title: '采购报表',
        description: '采购成本和绩效分析',
        url: 'https://procurement-report.company.com',
        icon: BarChart3,
        isExternal: true
      },
      {
        id: 'logistics-kpi',
        title: '物流KPI',
        description: '物流运输效率分析',
        url: 'https://logistics-kpi.company.com',
        icon: Gauge,
        isExternal: true
      },
      {
        id: 'supplier-scorecard',
        title: '供应商评分卡',
        description: '供应商绩效评估报告',
        url: 'https://scorecard.company.com',
        icon: Star,
        isExternal: true
      },
      {
        id: 'cost-analysis',
        title: '成本分析',
        description: '供应链成本结构分析',
        url: 'https://cost-analysis.company.com',
        icon: BarChart3,
        isExternal: true
      }
    ]
  },
  {
    id: 'collaboration',
    title: '协作平台',
    description: '团队协作和沟通工具',
    icon: Users,
    links: [
      {
        id: 'teams',
        title: 'Microsoft Teams',
        description: '团队沟通和协作平台',
        url: 'https://teams.microsoft.com',
        icon: Users,
        isExternal: true
      },
      {
        id: 'email-system',
        title: '企业邮箱',
        description: '公司内部邮件系统',
        url: 'https://mail.company.com',
        icon: Mail,
        isExternal: true
      },
      {
        id: 'calendar-system',
        title: '企业日历',
        description: '会议和日程管理',
        url: 'https://calendar.company.com',
        icon: Calendar,
        isExternal: true
      },
      {
        id: 'document-center',
        title: '文档中心',
        description: '企业文档共享平台',
        url: 'https://docs.company.com',
        icon: FileText,
        isExternal: true
      },
      {
        id: 'workflow-approval',
        title: '工作流审批',
        description: '业务流程审批系统',
        url: 'https://workflow.company.com',
        icon: Workflow,
        isExternal: true
      },
      {
        id: 'knowledge-base',
        title: '知识库',
        description: '业务知识管理平台',
        url: 'https://kb.company.com',
        icon: Bookmark,
        isExternal: true
      }
    ]
  }
];
