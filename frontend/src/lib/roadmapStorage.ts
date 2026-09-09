export interface YouTubeLecture {
  id: string;
  video_id: string;
  title: string;
  position: number;
  thumbnail?: string;
  channel_title?: string;
  embed_url: string;
}

export interface SavedYouTubePlaylist {
  topic: string;
  playlistId: string;
  title: string;
  channelTitle: string;
  embedUrl: string;
  thumbnail?: string;
  isPlaylist?: boolean;
  total_videos?: number;
  lectures?: YouTubeLecture[];
  completed_videos?: string[];
}

export interface SavedSkillRoadmap {
  id: string;
  savedAt: string;
  job: {
    title: string;
    company: string;
    location: string;
    salary?: string;
    applyLink?: string;
    description?: string;
  };
  skillsIHave: string[];
  requirements?: {
    allRequiredSkills?: string[];
    missingSkills: string[];
    needsDevelopment: string[];
    learningSteps?: Array<{ sequence: number; skill: string; focus: string[] }>;
    projectRecommendation?: string;
  };
  whatToLearn: {
    missingSkills: string[];
    needsDevelopment: string[];
    learningSteps?: Array<{ sequence: number; skill: string; focus: string[] }>;
    projectRecommendation?: string;
  };
  yt_playlists?: Record<string, SavedYouTubePlaylist>;
}

const STORAGE_KEY = "skillcatalyst_saved_roadmaps";

export function getSavedRoadmaps(): SavedSkillRoadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRoadmap(roadmap: SavedSkillRoadmap): boolean {
  if (typeof window === "undefined") return false;
  try {
    const roadmaps = getSavedRoadmaps();
    const existingIndex = roadmaps.findIndex((r) => r.id === roadmap.id);
    if (existingIndex >= 0) {
      roadmaps[existingIndex] = roadmap;
    } else {
      roadmaps.unshift(roadmap);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (e) {
    console.error("Failed to save roadmap:", e);
    return false;
  }
}

export function isRoadmapSaved(id: string): boolean {
  const roadmaps = getSavedRoadmaps();
  return roadmaps.some((r) => r.id === id);
}

export function removeRoadmap(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const roadmaps = getSavedRoadmaps().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to remove roadmap:", e);
  }
}

export function updateRoadmapYouTubePlaylist(
  roadmapId: string,
  topic: string,
  playlist: SavedYouTubePlaylist
): void {
  if (typeof window === "undefined") return;
  try {
    const roadmaps = getSavedRoadmaps();
    const target = roadmaps.find((r) => r.id === roadmapId);
    if (target) {
      if (!target.yt_playlists) {
        target.yt_playlists = {};
      }
      target.yt_playlists[topic] = playlist;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.error("Failed to update YouTube playlist in roadmap:", e);
  }
}

export function toggleVideoCompletion(
  roadmapId: string,
  topic: string,
  videoId: string
): { completed: boolean; totalCompleted: number; totalVideos: number } {
  if (typeof window === "undefined") return { completed: false, totalCompleted: 0, totalVideos: 0 };
  try {
    const roadmaps = getSavedRoadmaps();
    const target = roadmaps.find((r) => r.id === roadmapId);
    if (target && target.yt_playlists && target.yt_playlists[topic]) {
      const p = target.yt_playlists[topic];
      if (!p.completed_videos) p.completed_videos = [];
      const idx = p.completed_videos.indexOf(videoId);
      let isCompleted = false;
      if (idx >= 0) {
        p.completed_videos.splice(idx, 1);
        isCompleted = false;
      } else {
        p.completed_videos.push(videoId);
        isCompleted = true;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
      window.dispatchEvent(new Event("storage"));
      return {
        completed: isCompleted,
        totalCompleted: p.completed_videos.length,
        totalVideos: p.total_videos || p.lectures?.length || 1,
      };
    }
  } catch (e) {
    console.error("Error toggling video completion:", e);
  }
  return { completed: false, totalCompleted: 0, totalVideos: 0 };
}


