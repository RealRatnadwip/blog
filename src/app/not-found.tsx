import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mint-boot">
      <h1>404 — Page not found</h1>
      <p>This post does not exist or is not published.</p>
      <Link href="/" className="admin-btn primary">
        Back to desktop
      </Link>
    </main>
  );
}
