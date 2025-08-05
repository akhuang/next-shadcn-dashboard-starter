import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';

export const metadata = {
  title: 'Dashboard: Tableau'
};

export default function TableauDashboardPage() {
  const tableauUrl =
    'https://public.tableau.com/views/RegionalSampleWorkbook/Storms?:embed=yes&:display_count=yes&:showVizHome=no';

  return (
    <DashboardContainer fullWidth>
      <ExternalDashboard
        src={tableauUrl}
        title='Tableau Public Dashboard'
        height='100%'
        className='h-full'
      />
    </DashboardContainer>
  );
}
