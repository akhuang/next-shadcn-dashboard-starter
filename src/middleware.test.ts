import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// Mock NextRequest
function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe('Middleware', () => {
  test('should allow access to dashboard routes', async () => {
    const request = createRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);

    // Should not redirect (status 200 means NextResponse.next())
    expect(response.status).toBe(200);
  });

  test('should allow access to dashboard overview', async () => {
    const request = createRequest('http://localhost:3000/dashboard/overview');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  test('should allow access to dashboard contacts', async () => {
    const request = createRequest('http://localhost:3000/dashboard/contacts');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  test('should allow access to root route', async () => {
    const request = createRequest('http://localhost:3000/');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  test('should allow access to public routes', async () => {
    const request = createRequest('http://localhost:3000/public/image.png');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
