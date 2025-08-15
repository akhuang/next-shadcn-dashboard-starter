import PageContainer from '@/components/layout/page-container';
import ContactWorkspace from '@/features/contacts/components/contact-workspace';

export default function ContactsPage() {
  return (
    <PageContainer scrollable={false}>
      <ContactWorkspace />
    </PageContainer>
  );
}
