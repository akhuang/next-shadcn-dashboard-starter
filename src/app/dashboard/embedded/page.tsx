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
import dashboardConfig from '@/lib/dashboard-config.json';

export const metadata = {
  title: 'Dashboard: Embedded Overview'
};

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
          {dashboardConfig.dashboards.map((dashboard) => (
            <Card key={dashboard.id}>
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
                  href={`/dashboard/embedded/${dashboard.id}`}
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
