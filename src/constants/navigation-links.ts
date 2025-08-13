import {
  LucideIcon,
  Globe,
  FileText,
  Code,
  Database,
  GitBranch,
  Shield,
  Monitor,
  Users,
  Settings,
  Cloud,
  Package,
  Cpu,
  Gauge,
  Mail,
  Calendar,
  BarChart3,
  Lock,
  HelpCircle,
  Bookmark,
  MessageSquare,
  Zap,
  Server,
  Activity,
  Layers,
  Terminal,
  Bug,
  Search,
  Bell,
  Clipboard,
  Workflow,
  Archive,
  Image,
  Video,
  Download
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
    id: 'gitlab',
    title: 'GitLab',
    description: '代码仓库管理平台',
    url: 'https://gitlab.company.com',
    icon: GitBranch,
    isExternal: true
  },
  {
    id: 'jenkins',
    title: 'Jenkins',
    description: 'CI/CD 自动化构建',
    url: 'https://jenkins.company.com',
    icon: Gauge,
    isExternal: true
  },
  {
    id: 'confluence',
    title: 'Confluence',
    description: '团队协作文档平台',
    url: 'https://confluence.company.com',
    icon: FileText,
    isExternal: true
  },
  {
    id: 'jira',
    title: 'Jira',
    description: '项目管理和问题跟踪',
    url: 'https://jira.company.com',
    icon: Users,
    isExternal: true
  },
  {
    id: 'email',
    title: '企业邮箱',
    description: '公司内部邮件系统',
    url: 'https://mail.company.com',
    icon: Mail,
    isExternal: true
  },
  {
    id: 'grafana-quick',
    title: 'Grafana',
    description: '系统监控面板',
    url: 'https://grafana.company.com',
    icon: BarChart3,
    isExternal: true
  },
  {
    id: 'calendar',
    title: '企业日历',
    description: '会议和日程管理',
    url: 'https://calendar.company.com',
    icon: Calendar,
    isExternal: true
  },
  {
    id: 'vpn',
    title: 'VPN 管理',
    description: '远程访问网络',
    url: 'https://vpn.company.com',
    icon: Shield,
    isExternal: true
  }
];

export const navigationCategories: NavigationCategory[] = [
  {
    id: 'development',
    title: '开发工具',
    description: '代码开发和版本控制相关工具',
    icon: Code,
    links: [
      {
        id: 'gitlab-main',
        title: 'GitLab',
        description: '企业级代码仓库管理平台',
        url: 'https://gitlab.company.com',
        icon: GitBranch,
        isExternal: true
      },
      {
        id: 'sonar',
        title: 'SonarQube',
        description: '代码质量检测平台',
        url: 'https://sonar.company.com',
        icon: Shield,
        isExternal: true
      },
      {
        id: 'nexus',
        title: 'Nexus',
        description: 'Maven 私有仓库',
        url: 'https://nexus.company.com',
        icon: Package,
        isExternal: true
      },
      {
        id: 'harbor',
        title: 'Harbor',
        description: 'Docker 镜像仓库',
        url: 'https://harbor.company.com',
        icon: Package,
        isExternal: true
      },
      {
        id: 'code-review',
        title: 'CodeReview',
        description: '代码审查工具',
        url: 'https://review.company.com',
        icon: Search,
        isExternal: true
      },
      {
        id: 'artifactory',
        title: 'Artifactory',
        description: '制品管理仓库',
        url: 'https://artifactory.company.com',
        icon: Archive,
        isExternal: true
      },
      {
        id: 'postman',
        title: 'Postman',
        description: 'API 接口测试',
        url: 'https://postman.company.com',
        icon: Zap,
        isExternal: true
      }
    ]
  },
  {
    id: 'operations',
    title: '运维平台',
    description: '系统监控和运维管理工具',
    icon: Monitor,
    links: [
      {
        id: 'jenkins-ops',
        title: 'Jenkins',
        description: 'CI/CD 持续集成平台',
        url: 'https://jenkins.company.com',
        icon: Gauge,
        isExternal: true
      },
      {
        id: 'prometheus',
        title: 'Prometheus',
        description: '系统监控和告警',
        url: 'https://prometheus.company.com',
        icon: Monitor,
        isExternal: true
      },
      {
        id: 'grafana',
        title: 'Grafana',
        description: '数据可视化监控面板',
        url: 'https://grafana.company.com',
        icon: Monitor,
        isExternal: true
      },
      {
        id: 'kubernetes',
        title: 'Kubernetes Dashboard',
        description: '容器编排管理平台',
        url: 'https://k8s.company.com',
        icon: Cpu,
        isExternal: true
      },
      {
        id: 'rancher',
        title: 'Rancher',
        description: 'Kubernetes 集群管理',
        url: 'https://rancher.company.com',
        icon: Layers,
        isExternal: true
      },
      {
        id: 'docker-swarm',
        title: 'Docker Swarm',
        description: 'Docker 集群管理',
        url: 'https://swarm.company.com',
        icon: Package,
        isExternal: true
      },
      {
        id: 'alertmanager',
        title: 'AlertManager',
        description: '告警管理系统',
        url: 'https://alerts.company.com',
        icon: Bell,
        isExternal: true
      },
      {
        id: 'jaeger',
        title: 'Jaeger',
        description: '分布式链路追踪',
        url: 'https://jaeger.company.com',
        icon: Activity,
        isExternal: true
      },
      {
        id: 'nginx-manager',
        title: 'Nginx Manager',
        description: '负载均衡管理',
        url: 'https://nginx.company.com',
        icon: Server,
        isExternal: true
      }
    ]
  },
  {
    id: 'documentation',
    title: '文档协作',
    description: '知识管理和团队协作平台',
    icon: FileText,
    links: [
      {
        id: 'confluence-doc',
        title: 'Confluence',
        description: '企业知识库和文档协作',
        url: 'https://confluence.company.com',
        icon: FileText,
        isExternal: true
      },
      {
        id: 'wiki',
        title: 'Wiki',
        description: '技术文档和知识分享',
        url: 'https://wiki.company.com',
        icon: Globe,
        isExternal: true
      },
      {
        id: 'api-doc',
        title: 'API 文档',
        description: '接口文档管理平台',
        url: 'https://api-doc.company.com',
        icon: Code,
        isExternal: true
      },
      {
        id: 'swagger',
        title: 'Swagger UI',
        description: 'REST API 文档和测试',
        url: 'https://swagger.company.com',
        icon: FileText,
        isExternal: true
      },
      {
        id: 'gitbook',
        title: 'GitBook',
        description: '在线文档编辑平台',
        url: 'https://gitbook.company.com',
        icon: Bookmark,
        isExternal: true
      },
      {
        id: 'notion',
        title: 'Notion',
        description: '协作笔记和知识库',
        url: 'https://notion.company.com',
        icon: FileText,
        isExternal: true
      },
      {
        id: 'mindmap',
        title: '思维导图',
        description: '在线思维导图工具',
        url: 'https://mindmap.company.com',
        icon: Globe,
        isExternal: true
      }
    ]
  },
  {
    id: 'project',
    title: '项目管理',
    description: '项目跟踪和团队协作工具',
    icon: Users,
    links: [
      {
        id: 'jira-pm',
        title: 'Jira',
        description: '敏捷项目管理和缺陷跟踪',
        url: 'https://jira.company.com',
        icon: Users,
        isExternal: true
      },
      {
        id: 'redmine',
        title: 'Redmine',
        description: '项目管理和问题跟踪',
        url: 'https://redmine.company.com',
        icon: Settings,
        isExternal: true
      },
      {
        id: 'teams',
        title: 'Microsoft Teams',
        description: '团队沟通和协作平台',
        url: 'https://teams.microsoft.com',
        icon: Users,
        isExternal: true
      },
      {
        id: 'slack',
        title: 'Slack',
        description: '即时通讯和协作工具',
        url: 'https://slack.company.com',
        icon: MessageSquare,
        isExternal: true
      },
      {
        id: 'trello',
        title: 'Trello',
        description: '看板式项目管理',
        url: 'https://trello.company.com',
        icon: Clipboard,
        isExternal: true
      },
      {
        id: 'monday',
        title: 'Monday.com',
        description: '工作流管理平台',
        url: 'https://monday.company.com',
        icon: Workflow,
        isExternal: true
      },
      {
        id: 'asana',
        title: 'Asana',
        description: '团队任务管理工具',
        url: 'https://asana.company.com',
        icon: Users,
        isExternal: true
      },
      {
        id: 'clickup',
        title: 'ClickUp',
        description: '一体化工作平台',
        url: 'https://clickup.company.com',
        icon: Zap,
        isExternal: true
      }
    ]
  },
  {
    id: 'database',
    title: '数据服务',
    description: '数据库和数据管理工具',
    icon: Database,
    links: [
      {
        id: 'mysql-admin',
        title: 'phpMyAdmin',
        description: 'MySQL 数据库管理',
        url: 'https://mysql.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'redis-admin',
        title: 'Redis Commander',
        description: 'Redis 数据库管理',
        url: 'https://redis.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'elastic',
        title: 'Elasticsearch',
        description: '全文搜索引擎',
        url: 'https://elastic.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'kibana',
        title: 'Kibana',
        description: '日志分析和可视化',
        url: 'https://kibana.company.com',
        icon: Monitor,
        isExternal: true
      },
      {
        id: 'mongodb',
        title: 'MongoDB Compass',
        description: 'MongoDB 图形化管理',
        url: 'https://mongo.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'postgresql',
        title: 'pgAdmin',
        description: 'PostgreSQL 管理工具',
        url: 'https://postgres.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'cassandra',
        title: 'Cassandra',
        description: 'NoSQL 数据库管理',
        url: 'https://cassandra.company.com',
        icon: Database,
        isExternal: true
      },
      {
        id: 'influxdb',
        title: 'InfluxDB',
        description: '时序数据库管理',
        url: 'https://influx.company.com',
        icon: Activity,
        isExternal: true
      }
    ]
  },
  {
    id: 'cloud',
    title: '云服务',
    description: '云平台和服务管理',
    icon: Cloud,
    links: [
      {
        id: 'aws',
        title: 'AWS Console',
        description: '亚马逊云服务控制台',
        url: 'https://console.aws.amazon.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'aliyun',
        title: '阿里云',
        description: '阿里云管理控制台',
        url: 'https://console.aliyun.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'tencent-cloud',
        title: '腾讯云',
        description: '腾讯云管理控制台',
        url: 'https://console.cloud.tencent.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'huawei-cloud',
        title: '华为云',
        description: '华为云管理控制台',
        url: 'https://console.huaweicloud.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'azure',
        title: 'Microsoft Azure',
        description: '微软云服务平台',
        url: 'https://portal.azure.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'gcp',
        title: 'Google Cloud',
        description: '谷歌云平台控制台',
        url: 'https://console.cloud.google.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'digitalocean',
        title: 'DigitalOcean',
        description: '云服务器管理平台',
        url: 'https://cloud.digitalocean.com',
        icon: Server,
        isExternal: true
      }
    ]
  },
  {
    id: 'security',
    title: '安全管理',
    description: '安全监控和管理工具',
    icon: Lock,
    links: [
      {
        id: 'vault',
        title: 'HashiCorp Vault',
        description: '密钥管理和加密服务',
        url: 'https://vault.company.com',
        icon: Lock,
        isExternal: true
      },
      {
        id: 'keycloak',
        title: 'Keycloak',
        description: '身份认证和授权',
        url: 'https://auth.company.com',
        icon: Shield,
        isExternal: true
      },
      {
        id: 'fortify',
        title: 'Fortify',
        description: '代码安全扫描',
        url: 'https://fortify.company.com',
        icon: Bug,
        isExternal: true
      },
      {
        id: 'splunk',
        title: 'Splunk',
        description: '安全事件监控',
        url: 'https://splunk.company.com',
        icon: Monitor,
        isExternal: true
      },
      {
        id: 'nessus',
        title: 'Nessus',
        description: '漏洞扫描工具',
        url: 'https://nessus.company.com',
        icon: Search,
        isExternal: true
      }
    ]
  },
  {
    id: 'media',
    title: '媒体资源',
    description: '图片、视频和媒体管理',
    icon: Image,
    links: [
      {
        id: 'cdn',
        title: 'CDN 管理',
        description: '内容分发网络',
        url: 'https://cdn.company.com',
        icon: Cloud,
        isExternal: true
      },
      {
        id: 'oss',
        title: '对象存储',
        description: '文件存储服务',
        url: 'https://oss.company.com',
        icon: Archive,
        isExternal: true
      },
      {
        id: 'image-service',
        title: '图片处理',
        description: '图片压缩和处理',
        url: 'https://images.company.com',
        icon: Image,
        isExternal: true
      },
      {
        id: 'video-service',
        title: '视频处理',
        description: '视频转码和处理',
        url: 'https://video.company.com',
        icon: Video,
        isExternal: true
      }
    ]
  },
  {
    id: 'support',
    title: '支持与帮助',
    description: '技术支持和帮助文档',
    icon: HelpCircle,
    links: [
      {
        id: 'helpdesk',
        title: '服务台',
        description: 'IT 服务请求和工单',
        url: 'https://helpdesk.company.com',
        icon: HelpCircle,
        isExternal: true
      },
      {
        id: 'knowledge-base',
        title: '知识库',
        description: '技术问题解答',
        url: 'https://kb.company.com',
        icon: Bookmark,
        isExternal: true
      },
      {
        id: 'faq',
        title: '常见问题',
        description: 'FAQ 和帮助文档',
        url: 'https://faq.company.com',
        icon: MessageSquare,
        isExternal: true
      },
      {
        id: 'training',
        title: '培训平台',
        description: '在线学习和培训',
        url: 'https://training.company.com',
        icon: Globe,
        isExternal: true
      },
      {
        id: 'downloads',
        title: '下载中心',
        description: '软件和资源下载',
        url: 'https://downloads.company.com',
        icon: Download,
        isExternal: true
      }
    ]
  }
];
