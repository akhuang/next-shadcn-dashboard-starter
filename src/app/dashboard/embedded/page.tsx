import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard: Embedded Overview'
};

const dashboards = [
  {
    title: 'Grafana',
    description: 'Real-time monitoring and alerting metrics dashboard',
    href: '/dashboard/embedded/grafana',
    features: ['Real-time metrics', 'Alerting', 'Time series visualization']
  },
  {
    title: 'Metabase',
    description: 'Business intelligence and analytics dashboard',
    href: '/dashboard/embedded/metabase',
    features: ['Business analytics', 'SQL queries', 'Interactive charts']
  },
  {
    title: 'Kibana',
    description: 'Web traffic analysis and log visualization',
    href: '/dashboard/embedded/kibana',
    features: ['Log analysis', 'Search capabilities', 'Data exploration']
  },
  {
    title: 'Tableau',
    description: 'Advanced data visualization and analysis',
    href: '/dashboard/embedded/tableau',
    features: ['Data visualization', 'Interactive dashboards', 'Public sharing']
  }
];

export default function EmbeddedDashboardPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <div>
          <Heading
            title='Embedded Dashboards'
            description='External dashboards integrated into the application'
          />
          <Separator className='mt-4' />
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          {dashboards.map((dashboard) => (
            <Card key={dashboard.title}>
              <CardHeader>
                <CardTitle>{dashboard.title}</CardTitle>
                <CardDescription>{dashboard.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='text-muted-foreground mb-4 ml-4 list-disc text-sm'>
                  {dashboard.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  href={dashboard.href}
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'w-full'
                  )}
                >
                  View {dashboard.title} Dashboard
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
