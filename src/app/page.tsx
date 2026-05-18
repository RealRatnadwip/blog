import { getFeaturedPosts, getPublishedPosts, getTopTags } from "@/lib/posts";
import Desktop from "@/components/desktop";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Home() {
  const [featuredPosts, recentPosts] = await Promise.all([
    getFeaturedPosts(),
    getPublishedPosts({ limit: 20 }),
    getTopTags(),
  ]);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // We fetch but don't strictly need todos right now, keeping for compatibility
  await supabase.from('todos').select();

  return <Desktop posts={recentPosts} featured={featuredPosts} />;
}
