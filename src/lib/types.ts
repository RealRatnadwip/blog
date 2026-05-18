export type PostStatus = 'published' | 'draft' | 'archived' | 'private' | 'unlisted';

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  content_html: string;
  status: PostStatus;
  is_featured: boolean;
  reading_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mime_type?: string;
  size?: number;
  created_at: string;
}
