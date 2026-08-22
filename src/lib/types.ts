export type UserRole = 'admin' | 'viewer'
export type UserStatus = 'active' | 'disabled' | 'pending'

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string
  bio: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  category_id: string | null
  caption: string
  tags: string[]
  is_pinned: boolean
  is_featured: boolean
  is_trending: boolean
  views_count: number
  created_at: string
  updated_at: string
  category?: Category | null
  user?: Profile | null
  post_images?: PostImage[]
}

export interface PostImage {
  id: string
  post_id: string
  storage_path: string
  thumbnail_url: string
  medium_url: string
  original_url: string
  width: number
  height: number
  sort_order: number
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  user?: Profile | null
  replies?: Comment[]
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Share {
  id: string
  post_id: string
  user_id: string
  platform: string
  created_at: string
}

export interface Favorite {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Rating {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
  user?: Profile | null
}

export interface Conversation {
  id: string
  viewer_id: string
  admin_id: string | null
  created_at: string
  updated_at: string
  viewer?: Profile | null
  admin?: Profile | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  image_url: string
  is_read: boolean
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
  user?: Profile | null
}

export interface PostWithRelations extends Post {
  likes_count?: number
  comments_count?: number
  shares_count?: number
  favorites_count?: number
  liked_by_me?: boolean
  favorited_by_me?: boolean
}
