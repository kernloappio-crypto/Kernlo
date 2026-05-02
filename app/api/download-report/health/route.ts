import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/download-report/health',
    timestamp: new Date().toISOString(),
  });
}
