export type ExpiryType = "permanent" | "date" | "views";
export type CreationStatus = "draft" | "published";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface Profile {
  id: string;
  invite_code_used: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InviteCode {
  code: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export interface Creation {
  id: string;
  slug: string;
  creator_id: string;
  title: string | null;
  dedication: string | null;
  voice_audio_url: string;
  voice_duration_sec: number | null;
  transcription: WordTimestamp[];
  music_jamendo_id: string | null;
  music_name: string | null;
  music_artist: string | null;
  music_preview_url: string | null;
  voice_gain: number;
  music_gain: number;
  expiry_type: ExpiryType;
  expiry_date: string | null;
  expiry_views: number | null;
  view_count: number;
  status: CreationStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViewEvent {
  id: string;
  creation_id: string;
  viewed_at: string;
  ip_hash: string | null;
  user_agent: string | null;
}

export interface MusicTrack {
  jamendo_id: string;
  name: string;
  artist: string;
  preview_url: string;
  duration: number;
  mood?: string;
}

// Supabase Database type (simplified for direct use)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
