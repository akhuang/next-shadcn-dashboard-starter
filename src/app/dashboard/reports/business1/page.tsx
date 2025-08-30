import PageContainer from '@/components/layout/page-container';
import ExcelWorkspace from '@/features/excel/components/excel-workspace';

export default function Business1ReportPage() {
  return (
    <PageContainer scrollable={false}>
      <ExcelWorkspace dataSource='reports:business1' title='经营报表' />
    </PageContainer>
  );
}
