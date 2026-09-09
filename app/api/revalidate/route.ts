import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paths: string[] = body.paths || ['/', '/collections'];

    for (const p of paths) {
      try {
        revalidatePath(p, 'page');
      } catch {}
    }

    return NextResponse.json({ revalidated: true, paths });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error revalidating';
    return NextResponse.json({ revalidated: false, error: message }, { status: 500 });
  }
}
