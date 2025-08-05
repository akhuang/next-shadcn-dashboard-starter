import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';

export const metadata = {
  title: 'Dashboard: Grafana'
};

export default function GrafanaDashboardPage() {
  // Grafana Play 可能有嵌入限制，可以尝试其他公开的 Grafana 实例
  const grafanaUrl =
    'https://play.grafana.org/d/000000074/alerting?orgId=1&kiosk';

  // 备选：如果上面的不工作，可以使用这个
  // const grafanaUrl = 'https://snapshot.raintank.io/dashboard/snapshot/y7zwi2bZ7FcoTlB93WN7yWO4aMiz3pZb?from=1493369923321&to=1493377123321';

  return (
    <DashboardContainer fullWidth>
      <ExternalDashboard
        src={grafanaUrl}
        title='Grafana Alerting Dashboard'
        height='100%'
        className='h-full'
      />
    </DashboardContainer>
  );
}
