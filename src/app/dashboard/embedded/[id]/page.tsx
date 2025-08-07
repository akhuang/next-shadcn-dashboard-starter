import { ExternalDashboard } from '@/components/external-dashboard';
import DashboardContainer from '@/components/layout/dashboard-container';
import { notFound } from 'next/navigation';
import dashboardConfig from '@/lib/dashboard-config.json';

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { id } = await params;
  const dashboard = dashboardConfig.dashboards.find((d) => d.id === id);

  if (!dashboard) {
    return {
      title: 'Dashboard Not Found'
    };
  }

  return {
    title: `Dashboard: ${dashboard.title}`
  };
}

export function generateStaticParams() {
  return dashboardConfig.dashboards.map((dashboard) => ({
    id: dashboard.id
  }));
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const dashboard = dashboardConfig.dashboards.find((d) => d.id === id);

  if (!dashboard) {
    notFound();
  }

  return (
    <DashboardContainer fullWidth>
      <ExternalDashboard
        src={dashboard.proxyUrl}
        title={`${dashboard.title} Dashboard`}
        height='100%'
        className='h-full'
      />
    </DashboardContainer>
  );
}
