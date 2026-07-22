import { VolunteerApplyForm } from '@kit/community/components';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const generateMetadata = async () => {
  return {
    title: 'Volunteer',
    description: 'Apply to help support the DuaPrayer community space.',
  };
};

async function VolunteerPage() {
  await requireUserInServerComponent();

  return (
    <div className="container mx-auto max-w-xl space-y-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Volunteer</h1>
        <p className="text-muted-foreground text-sm">
          Apply to help with community support and moderation. Applications are
          reviewed by admins.
        </p>
      </header>
      <VolunteerApplyForm />
    </div>
  );
}

export default VolunteerPage;
