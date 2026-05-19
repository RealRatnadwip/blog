"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
        setLoading(false);
      });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function remove(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts((p) => p.filter((x) => x.id !== id));
  }

  async function setStatus(id: string, status: Post["status"]) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    if (res.ok) {
      setPosts((p) => p.map((x) => (x.id === id ? updated : x)));
    }
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <h1>Posts</h1>
        <div className="admin-header-actions">
          <Link href="/admin/posts/new" className="admin-btn primary">
            New post
          </Link>
          <button type="button" className="admin-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      {loading ? (
        <p>Loading…</p>
      ) : posts.length === 0 ? (
        <p className="admin-empty">No posts yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>
                  <code>/{post.slug}</code>
                </td>
                <td>
                  <span className={`status-pill status-${post.status}`}>
                    {post.status}
                  </span>
                </td>
                <td>{new Date(post.updated_at).toLocaleString()}</td>
                <td className="admin-row-actions">
                  <Link href={`/admin/posts/${post.id}`}>Edit</Link>
                  {post.status !== "published" && (
                    <button
                      type="button"
                      onClick={() => setStatus(post.id, "published")}
                    >
                      Publish
                    </button>
                  )}
                  {post.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => setStatus(post.id, "archived")}
                    >
                      Archive
                    </button>
                  )}
                  {post.status !== "private" && (
                    <button
                      type="button"
                      onClick={() => setStatus(post.id, "private")}
                    >
                      Private
                    </button>
                  )}
                  {post.status !== "unlinked" && (
                    <button
                      type="button"
                      onClick={() => setStatus(post.id, "unlinked")}
                    >
                      Unlink
                    </button>
                  )}
                  <button type="button" onClick={() => remove(post.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
