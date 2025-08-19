const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 导航数据
const navigationData = [
  // 开发工具
  {
    类别: '开发工具',
    名字: 'GitLab',
    链接: 'https://gitlab.company.com',
    说明: '代码仓库管理平台'
  },
  {
    类别: '开发工具',
    名字: 'Jenkins',
    链接: 'https://jenkins.company.com',
    说明: 'CI/CD 自动化构建平台'
  },
  {
    类别: '开发工具',
    名字: 'SonarQube',
    链接: 'https://sonar.company.com',
    说明: '代码质量检测平台'
  },
  {
    类别: '开发工具',
    名字: 'Nexus',
    链接: 'https://nexus.company.com',
    说明: '制品仓库管理'
  },
  {
    类别: '开发工具',
    名字: 'Harbor',
    链接: 'https://harbor.company.com',
    说明: 'Docker 镜像仓库'
  },
  {
    类别: '开发工具',
    名字: 'Rancher',
    链接: 'https://rancher.company.com',
    说明: 'Kubernetes 管理平台'
  },

  // 监控系统
  {
    类别: '监控系统',
    名字: 'Grafana',
    链接: 'https://grafana.company.com',
    说明: '系统监控可视化面板'
  },
  {
    类别: '监控系统',
    名字: 'Prometheus',
    链接: 'https://prometheus.company.com',
    说明: '时序数据监控系统'
  },
  {
    类别: '监控系统',
    名字: 'ELK Stack',
    链接: 'https://elk.company.com',
    说明: '日志收集分析平台'
  },
  {
    类别: '监控系统',
    名字: 'Kibana',
    链接: 'https://kibana.company.com',
    说明: '日志可视化分析'
  },
  {
    类别: '监控系统',
    名字: 'Zabbix',
    链接: 'https://zabbix.company.com',
    说明: '基础设施监控'
  },
  {
    类别: '监控系统',
    名字: 'SkyWalking',
    链接: 'https://skywalking.company.com',
    说明: 'APM 应用性能监控'
  },

  // 协作工具
  {
    类别: '协作工具',
    名字: 'Confluence',
    链接: 'https://confluence.company.com',
    说明: '文档协作平台'
  },
  {
    类别: '协作工具',
    名字: 'JIRA',
    链接: 'https://jira.company.com',
    说明: '项目管理与问题跟踪'
  },
  {
    类别: '协作工具',
    名字: 'Teams',
    链接: 'https://teams.company.com',
    说明: '团队沟通协作'
  },
  {
    类别: '协作工具',
    名字: 'Slack',
    链接: 'https://slack.company.com',
    说明: '即时通讯工具'
  },
  {
    类别: '协作工具',
    名字: 'Wiki',
    链接: 'https://wiki.company.com',
    说明: '知识库平台'
  },
  {
    类别: '协作工具',
    名字: 'SharePoint',
    链接: 'https://sharepoint.company.com',
    说明: '文档共享平台'
  },

  // 测试平台
  {
    类别: '测试平台',
    名字: 'TestRail',
    链接: 'https://testrail.company.com',
    说明: '测试用例管理'
  },
  {
    类别: '测试平台',
    名字: 'JMeter',
    链接: 'https://jmeter.company.com',
    说明: '性能测试平台'
  },
  {
    类别: '测试平台',
    名字: 'Selenium Grid',
    链接: 'https://selenium.company.com',
    说明: '自动化测试平台'
  },
  {
    类别: '测试平台',
    名字: 'Postman',
    链接: 'https://postman.company.com',
    说明: 'API 测试工具'
  },
  {
    类别: '测试平台',
    名字: 'LoadRunner',
    链接: 'https://loadrunner.company.com',
    说明: '负载测试工具'
  },

  // 数据平台
  {
    类别: '数据平台',
    名字: 'Hadoop',
    链接: 'https://hadoop.company.com',
    说明: '大数据处理平台'
  },
  {
    类别: '数据平台',
    名字: 'Spark',
    链接: 'https://spark.company.com',
    说明: '大数据计算引擎'
  },
  {
    类别: '数据平台',
    名字: 'Kafka',
    链接: 'https://kafka.company.com',
    说明: '消息队列系统'
  },
  {
    类别: '数据平台',
    名字: 'Flink',
    链接: 'https://flink.company.com',
    说明: '流处理框架'
  },
  {
    类别: '数据平台',
    名字: 'Elasticsearch',
    链接: 'https://es.company.com',
    说明: '搜索引擎'
  },
  {
    类别: '数据平台',
    名字: 'ClickHouse',
    链接: 'https://clickhouse.company.com',
    说明: 'OLAP 数据库'
  },

  // 安全工具
  {
    类别: '安全工具',
    名字: 'Vault',
    链接: 'https://vault.company.com',
    说明: '密钥管理系统'
  },
  {
    类别: '安全工具',
    名字: 'LDAP',
    链接: 'https://ldap.company.com',
    说明: '统一认证系统'
  },
  {
    类别: '安全工具',
    名字: 'SSO Portal',
    链接: 'https://sso.company.com',
    说明: '单点登录门户'
  },
  {
    类别: '安全工具',
    名字: 'Fortify',
    链接: 'https://fortify.company.com',
    说明: '代码安全扫描'
  },
  {
    类别: '安全工具',
    名字: 'WAF',
    链接: 'https://waf.company.com',
    说明: 'Web 应用防火墙'
  },

  // 业务系统
  {
    类别: '业务系统',
    名字: 'ERP',
    链接: 'https://erp.company.com',
    说明: '企业资源计划系统'
  },
  {
    类别: '业务系统',
    名字: 'CRM',
    链接: 'https://crm.company.com',
    说明: '客户关系管理系统'
  },
  {
    类别: '业务系统',
    名字: 'OA',
    链接: 'https://oa.company.com',
    说明: '办公自动化系统'
  },
  {
    类别: '业务系统',
    名字: 'HRM',
    链接: 'https://hrm.company.com',
    说明: '人力资源管理系统'
  },
  {
    类别: '业务系统',
    名字: 'SCM',
    链接: 'https://scm.company.com',
    说明: '供应链管理系统'
  },
  {
    类别: '业务系统',
    名字: 'WMS',
    链接: 'https://wms.company.com',
    说明: '仓储管理系统'
  },
  {
    类别: '业务系统',
    名字: 'MES',
    链接: 'https://mes.company.com',
    说明: '制造执行系统'
  },
  {
    类别: '业务系统',
    名字: 'BI Portal',
    链接: 'https://bi.company.com',
    说明: '商业智能门户'
  },

  // 内部工具
  {
    类别: '内部工具',
    名字: 'VPN Portal',
    链接: 'https://vpn.company.com',
    说明: 'VPN 接入门户'
  },
  {
    类别: '内部工具',
    名字: 'Email',
    链接: 'https://mail.company.com',
    说明: '企业邮箱系统'
  },
  {
    类别: '内部工具',
    名字: 'IT Service',
    链接: 'https://it.company.com',
    说明: 'IT 服务台'
  },
  {
    类别: '内部工具',
    名字: 'Asset Management',
    链接: 'https://asset.company.com',
    说明: '资产管理系统'
  },
  {
    类别: '内部工具',
    名字: 'Meeting Room',
    链接: 'https://meeting.company.com',
    说明: '会议室预订系统'
  },
  {
    类别: '内部工具',
    名字: 'Training Platform',
    链接: 'https://training.company.com',
    说明: '培训学习平台'
  },
  {
    类别: '内部工具',
    名字: 'Knowledge Base',
    链接: 'https://kb.company.com',
    说明: '知识库系统'
  },
  {
    类别: '内部工具',
    名字: 'Feedback',
    链接: 'https://feedback.company.com',
    说明: '意见反馈系统'
  }
];

// 创建工作簿
function createNavigationExcel() {
  const ws = XLSX.utils.json_to_sheet(navigationData);
  const wb = XLSX.utils.book_new();

  // 设置列宽
  const colWidths = [
    { wch: 15 }, // 类别
    { wch: 20 }, // 名字
    { wch: 40 }, // 链接
    { wch: 30 } // 说明
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, '导航数据');

  // 创建目录
  const outputDir = '/tmp/test-navigation';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入文件
  const outputPath = path.join(outputDir, 'navigation.xlsx');
  XLSX.writeFile(wb, outputPath);

  console.log(`导航数据 Excel 文件已创建: ${outputPath}`);
  console.log(
    `包含 ${navigationData.length} 个系统，分为 ${new Set(navigationData.map((d) => d.类别)).size} 个类别`
  );

  // 显示分类统计
  const categories = {};
  navigationData.forEach((item) => {
    categories[item.类别] = (categories[item.类别] || 0) + 1;
  });

  console.log('\n分类统计:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} 个系统`);
  });
}

// 执行创建
createNavigationExcel();
