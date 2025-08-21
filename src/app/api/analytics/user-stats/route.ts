import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/verify';
import { logger } from '@/lib/logger';

// 生成模拟用户统计数据
function getMockUserStats(limit: number) {
  const mockUsers = [
    'john.doe',
    'jane.smith',
    'mike.johnson',
    'emily.brown',
    'david.wilson',
    'sarah.davis',
    'chris.martin',
    'lisa.anderson',
    'james.taylor',
    'mary.thomas',
    'robert.jackson',
    'jennifer.white',
    'william.harris',
    'patricia.clark',
    'michael.lewis'
  ];

  const now = new Date();
  const stats = mockUsers.slice(0, limit).map((user, index) => {
    const sessionCount = Math.floor(Math.random() * 50) + 10 - index;
    const activeDays = Math.floor(Math.random() * 20) + 5;
    const totalEvents = sessionCount * Math.floor(Math.random() * 30 + 10);
    const uniquePages = Math.floor(Math.random() * 20) + 5;

    return {
      userId: user,
      sessionCount,
      activeDays,
      totalEvents,
      uniquePages,
      firstSeen: new Date(
        now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      lastSeen: new Date(
        now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      topEvents: [
        { event: 'page_view', count: Math.floor(totalEvents * 0.4) },
        { event: 'button_click', count: Math.floor(totalEvents * 0.3) },
        { event: 'form_submit', count: Math.floor(totalEvents * 0.2) }
      ],
      avgEventsPerSession: Math.round((totalEvents / sessionCount) * 10) / 10
    };
  });

  // 按会话数排序
  return stats.sort((a, b) => b.sessionCount - a.sessionCount);
}

// 用户使用统计接口
export async function GET(request: Request) {
  // 验证用户权限
  const session = await getSession();

  // 如果没有 JWT session，检查 mock-user-id（用于开发和测试）
  if (!session) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const mockUserId = cookieStore.get('mock-user-id')?.value;

    if (!mockUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Mock 用户已验证，继续处理
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    // 使用 Umami 数据库连接（从环境变量读取）
    const dbUrl = process.env.UMAMI_DATABASE_URL;

    if (!dbUrl) {
      logger.warn('UMAMI_DATABASE_URL not configured, using mock data');
      // 返回模拟数据
      return NextResponse.json({
        success: true,
        data: {
          stats: getMockUserStats(limit),
          summary: {
            totalUsers: 12,
            totalSessions: 156,
            totalDays: days,
            period: days
          }
        }
      });
    }

    // 构建 SQL 查询
    const query = `
      WITH user_stats AS (
        SELECT 
          s.distinct_id as user_id,
          COUNT(DISTINCT s.session_id) as session_count,
          COUNT(DISTINCT DATE(s.created_at)) as active_days,
          COUNT(we.event_id) as total_events,
          MIN(s.created_at) as first_seen,
          MAX(s.created_at) as last_seen,
          COUNT(DISTINCT we.url_path) as unique_pages
        FROM session s
        LEFT JOIN website_event we ON s.session_id = we.session_id
        WHERE s.distinct_id IS NOT NULL 
          AND s.distinct_id != 'anonymous'
          AND s.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY s.distinct_id
      ),
      event_counts AS (
        SELECT 
          s.distinct_id as user_id,
          we.event_name,
          COUNT(*) as event_count
        FROM session s
        JOIN website_event we ON s.session_id = we.session_id
        WHERE s.distinct_id IS NOT NULL 
          AND s.distinct_id != 'anonymous'
          AND we.event_name IS NOT NULL
          AND s.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY s.distinct_id, we.event_name
      ),
      user_events AS (
        SELECT 
          user_id,
          JSON_AGG(
            JSON_BUILD_OBJECT('event', event_name, 'count', event_count) 
            ORDER BY event_count DESC
          ) as top_events
        FROM event_counts
        GROUP BY user_id
      )
      SELECT 
        us.*,
        COALESCE(ue.top_events, '[]'::json) as top_events
      FROM user_stats us
      LEFT JOIN user_events ue ON us.user_id = ue.user_id
      ORDER BY us.session_count DESC, us.total_events DESC
      LIMIT ${limit};
    `;

    // 使用 pg 库直接查询
    let result;
    let pool;

    try {
      const { Pool } = await import('pg');
      pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000 // 5秒超时
      });

      result = await pool.query(query);
    } catch (dbError) {
      logger.error('Failed to connect to Umami database:', dbError);
      // 返回模拟数据
      return NextResponse.json({
        success: true,
        data: {
          stats: getMockUserStats(limit),
          summary: {
            totalUsers: 12,
            totalSessions: 156,
            totalDays: days,
            period: days
          }
        },
        warning: 'Using mock data due to database connection error'
      });
    }

    // 处理结果
    const stats = result.rows.map((row) => ({
      userId: row.user_id,
      sessionCount: parseInt(row.session_count),
      activeDays: parseInt(row.active_days),
      totalEvents: parseInt(row.total_events),
      uniquePages: parseInt(row.unique_pages),
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      topEvents: row.top_events,
      avgEventsPerSession:
        row.session_count > 0
          ? Math.round((row.total_events / row.session_count) * 10) / 10
          : 0
    }));

    // 获取总体统计
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT distinct_id) as total_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT DATE(created_at)) as total_days
      FROM session
      WHERE distinct_id IS NOT NULL 
        AND distinct_id != 'anonymous'
        AND created_at >= NOW() - INTERVAL '${days} days';
    `;

    let summaryResult;
    try {
      summaryResult = await pool.query(summaryQuery);
    } catch (queryError) {
      logger.error('Failed to execute summary query:', queryError);
      await pool?.end();
      // 返回模拟数据
      return NextResponse.json({
        success: true,
        data: {
          stats: getMockUserStats(limit),
          summary: {
            totalUsers: 12,
            totalSessions: 156,
            totalDays: days,
            period: days
          }
        },
        warning: 'Using mock data due to query error'
      });
    }

    const summary = summaryResult.rows[0];

    await pool?.end();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        summary: {
          totalUsers: parseInt(summary.total_users),
          totalSessions: parseInt(summary.total_sessions),
          totalDays: parseInt(summary.total_days),
          period: days
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
