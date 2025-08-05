import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';

export const metadata = {
  title: 'Dashboard: Grafana'
};

export default function GrafanaDashboardPage() {
  const grafanaUrl =
    'https://play.grafana.org/d/000000074/alerting?orgId=1&kiosk';

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
