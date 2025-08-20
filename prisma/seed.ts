import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 创建模拟用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@company.com' },
    update: {},
    create: {
      email: 'test@company.com',
      username: 'testuser',
      displayName: '测试用户',
      department: '技术部',
      adUsername: 'DOMAIN\\testuser'
    }
  });

  console.log('Created test user:', testUser);

  // 创建导航分类
  const categories = [
    { name: '开发工具', description: '开发相关工具和平台', sortOrder: 1 },
    { name: '监控系统', description: '系统监控和日志分析', sortOrder: 2 },
    { name: '协作工具', description: '团队协作和沟通工具', sortOrder: 3 },
    { name: '测试平台', description: '测试和质量保证工具', sortOrder: 4 },
    { name: '数据平台', description: '大数据和分析平台', sortOrder: 5 },
    { name: '安全工具', description: '安全和认证系统', sortOrder: 6 },
    { name: '业务系统', description: '企业业务管理系统', sortOrder: 7 },
    { name: '内部工具', description: '内部服务和工具', sortOrder: 8 }
  ];

  for (const cat of categories) {
    await prisma.navigationCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat
    });
  }

  console.log('Created navigation categories');

  // 创建一些示例导航项
  const navigationItems = [
    {
      id: 'gitlab',
      category: '开发工具',
      name: 'GitLab',
      url: 'https://gitlab.company.com',
      description: '代码仓库管理平台',
      isExternal: true
    },
    {
      id: 'jenkins',
      category: '开发工具',
      name: 'Jenkins',
      url: 'https://jenkins.company.com',
      description: 'CI/CD 自动化构建平台',
      isExternal: true
    },
    {
      id: 'grafana',
      category: '监控系统',
      name: 'Grafana',
      url: 'https://grafana.company.com',
      description: '系统监控可视化面板',
      isExternal: true
    },
    {
      id: 'confluence',
      category: '协作工具',
      name: 'Confluence',
      url: 'https://confluence.company.com',
      description: '文档协作平台',
      isExternal: true
    },
    {
      id: 'jira',
      category: '协作工具',
      name: 'JIRA',
      url: 'https://jira.company.com',
      description: '项目管理与问题跟踪',
      isExternal: true
    }
  ];

  for (const item of navigationItems) {
    await prisma.navigationItem.upsert({
      where: { id: item.id },
      update: item,
      create: item
    });
  }

  console.log('Created navigation items');

  // 为测试用户添加一些收藏
  await prisma.navigationFavorite.upsert({
    where: {
      userId_itemId: {
        userId: testUser.id,
        itemId: 'gitlab'
      }
    },
    update: {},
    create: {
      userId: testUser.id,
      itemId: 'gitlab'
    }
  });

  await prisma.navigationFavorite.upsert({
    where: {
      userId_itemId: {
        userId: testUser.id,
        itemId: 'jira'
      }
    },
    update: {},
    create: {
      userId: testUser.id,
      itemId: 'jira'
    }
  });

  console.log('Created user favorites');

  // 添加一些访问记录
  await prisma.navigationVisit.upsert({
    where: {
      userId_itemId: {
        userId: testUser.id,
        itemId: 'gitlab'
      }
    },
    update: {
      count: { increment: 1 },
      lastVisitAt: new Date()
    },
    create: {
      userId: testUser.id,
      itemId: 'gitlab',
      count: 5,
      lastVisitAt: new Date()
    }
  });

  await prisma.navigationVisit.upsert({
    where: {
      userId_itemId: {
        userId: testUser.id,
        itemId: 'jenkins'
      }
    },
    update: {
      count: { increment: 1 },
      lastVisitAt: new Date()
    },
    create: {
      userId: testUser.id,
      itemId: 'jenkins',
      count: 3,
      lastVisitAt: new Date(Date.now() - 3600000) // 1小时前
    }
  });

  console.log('Created visit records');
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
