import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';

export const metadata = {
  title: 'Dashboard: Grafana'
};

export default function GrafanaDashboardPage() {
  // 使用代理路径来绕过 X-Frame-Options 限制
  const grafanaUrl =
    '/proxy/play.grafana.org/d/000000074/alerting?orgId=1&kiosk';

  return (
    <DashboardContainer fullWidth>
      <ExternalDashboard
        src={grafanaUrl}
        title='Grafana Play Dashboard'
        height='100%'
        className='h-full'
      />
    </DashboardContainer>
  );
}
