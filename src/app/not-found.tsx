/**
 * not-found.tsx — 404 page (Server Component wrapper required by Next.js App Router)
 * The animated inner content is in NotFoundContent (client component).
 */
import { NotFoundContent } from "@/components/brand/NotFoundContent";

export const metadata = {
  title: "Page Not Found — RASTAH से",
};

export default function NotFound() {
  return <NotFoundContent />;
}
