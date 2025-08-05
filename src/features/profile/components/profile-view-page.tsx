// import { UserProfile } from '@clerk/nextjs';

export default function ProfileViewPage() {
  return (
    <div className='flex w-full flex-col p-4'>
      {/* <UserProfile /> */}
      <div className='rounded-lg border p-8'>
        <h2 className='mb-4 text-2xl font-bold'>User Profile</h2>
        <div className='space-y-4'>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Name
            </label>
            <p className='text-lg'>Dev User</p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Email
            </label>
            <p className='text-lg'>dev@example.com</p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Role
            </label>
            <p className='text-lg'>Developer</p>
          </div>
        </div>
        <p className='text-muted-foreground mt-8 text-sm'>
          Authentication is currently disabled for development.
        </p>
      </div>
    </div>
  );
}
