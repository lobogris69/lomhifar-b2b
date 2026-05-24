import { NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/auth';

export async function POST() {
  destroyAdminSession();
  return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
}
