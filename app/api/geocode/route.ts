import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geocodeAddress } from '@/lib/geocode';

const schema = z.object({
  query: z.string().min(2),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowy adres.' }, { status: 400 });
  }

  const results = await geocodeAddress(parsed.data.query);
  return NextResponse.json({ results });
}
