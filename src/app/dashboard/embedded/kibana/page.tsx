import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';

export const metadata = {
  title: 'Dashboard: Kibana'
};

export default function KibanaDashboardPage() {
  const kibanaUrl =
    'https://demo.elastic.co/app/dashboards#/view/722b74f0-b882-11e8-a6d9-e546fe2bba5f?embed=true';

  return (
    <DashboardContainer fullWidth>
      <ExternalDashboard
        src={kibanaUrl}
        title='Kibana Demo Dashboard'
        height='100%'
        className='h-full'
      />
    </DashboardContainer>
  );
}
