import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long!!!'
);

export interface UserSession {
  username: string;
  displayName: string;
  email: string;
  department?: string;
  groups?: string[];
}

export async function createToken(user: UserSession): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(secret);

  return token;
}

export async function verifyAuth(token: string): Promise<UserSession> {
  const { payload } = await jwtVerify(token, secret);
  return payload.user as UserSession;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  try {
    return await verifyAuth(token);
  } catch {
    return null;
  }
}
