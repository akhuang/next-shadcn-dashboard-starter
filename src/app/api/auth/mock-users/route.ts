import { NextResponse } from 'next/server';
import { createMockAuth } from '@/lib/auth/mock-auth';

export async function GET() {
  // Only available in development mode
  if (process.env.AUTH_MODE === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const mockAuth = createMockAuth();
  const users = mockAuth.getAvailableUsers();

  return NextResponse.json({ users });
}
