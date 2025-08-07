import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';

export const metadata = {
  title: 'Dashboard: Metabase'
};

export default function MetabaseDashboardPage() {
  // 使用 Nginx 代理路径
  const metabaseUrl = '/proxy/metabase.com/demo/dashboard/1';

  return (
    <DashboardContainer fullWidth>
      <ExternalDashboard
        src={metabaseUrl}
        title='Metabase Demo Dashboard'
        height='100%'
        className='h-full'
      />
    </DashboardContainer>
  );
}
