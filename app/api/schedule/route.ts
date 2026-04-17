import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSchedule } from '@/lib/providers';

const locationSchema = z.object({
  label: z.string(),
  lat: z.string(),
  lon: z.string(),
  city: z.string(),
  suburb: z.string(),
  road: z.string(),
  houseNumber: z.string(),
  postcode: z.string(),
  county: z.string(),
  state: z.string(),
  municipality: z.string(),
  keyCity: z.string(),
  keySuburb: z.string(),
  keyMunicipality: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = locationSchema.safeParse(body.location);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane lokalizacji.' }, { status: 400 });
  }

  const providers = await resolveSchedule(parsed.data);
  return NextResponse.json({ providers });
}
