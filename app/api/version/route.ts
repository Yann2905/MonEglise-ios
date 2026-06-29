// Renvoie l'ID de build du déploiement courant.
// Utilisé par UpdateChecker pour détecter qu'une nouvelle version est en ligne.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return new Response(
    JSON.stringify({ buildId: process.env.NEXT_PUBLIC_BUILD_ID }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
