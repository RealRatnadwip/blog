import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getPostByIdAdmin } from "@/lib/posts";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostByIdAdmin(id);
  if (!post) notFound();
  return (
    <main className="admin-dashboard">
      <h1>Edit post</h1>
      <PostForm post={post} />
    </main>
  );
}
