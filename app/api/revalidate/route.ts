import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATION_SECRET;

    // Protection against excessive ISR writes to guarantee remaining under Vercel Free tier forever
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        {
          revalidated: false,
          message: 'On-demand ISR revalidation is disabled or protected with REVALIDATION_SECRET to prevent free quota exhaustion.',
        },
        { status: 401 }
      );
    }

    const paths: string[] = body.paths || ['/'];

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
