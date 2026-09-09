"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  FolderOpen,
  ListChecks,
  Code2,
  RefreshCw,
  Loader2,
  Play,
  Volume2,
  X,
  Tv,
  Check,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Award,
  Info,
} from "lucide-react";
import {
  SavedSkillRoadmap,
  SavedYouTubePlaylist,
  YouTubeLecture,
  getSavedRoadmaps,
  removeRoadmap,
  updateRoadmapYouTubePlaylist,
  toggleVideoCompletion,
} from "@/lib/roadmapStorage";
import { api } from "@/lib/api";

function SkillTracksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student_id");

  const [roadmaps, setRoadmaps] = useState<SavedSkillRoadmap[]>([]);
  const [activeSection, setActiveSection] = useState<"req" | "saved" | "lectures">("req");
  const [isLoaded, setIsLoaded] = useState(false);

  // Active roadmap and topic selection for Learning Lectures
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [activeLectureVideoId, setActiveLectureVideoId] = useState<string | null>(null);

  // State for active YouTube video info
  const [activeVideo, setActiveVideo] = useState<{
    roadmapId: string;
    topic: string;
    playlistId: string;
    title: string;
    channelTitle: string;
    embedUrl: string;
    isPlaylist?: boolean;
  } | null>(null);

  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [videoNotice, setVideoNotice] = useState<string | null>(null);

  const loadRoadmaps = () => {
    const list = getSavedRoadmaps();
    setRoadmaps(list);
    setIsLoaded(true);

    if (list.length > 0 && !selectedRoadmapId) {
      setSelectedRoadmapId(list[0].id);
      // Pick first learning step as default topic if available
      const firstStep = list[0].whatToLearn?.learningSteps?.[0]?.skill;
      if (firstStep) {
        setSelectedTopic(firstStep);
      }
    }
  };

  useEffect(() => {
    loadRoadmaps();
    const handleStorage = () => loadRoadmaps();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVideo?.roadmapId === id) {
      setActiveVideo(null);
    }
    if (selectedRoadmapId === id) {
      const remaining = roadmaps.filter((r) => r.id !== id);
      setSelectedRoadmapId(remaining.length > 0 ? remaining[0].id : null);
    }
    removeRoadmap(id);
    loadRoadmaps();
  };

  // Helper to fetch top 1 playlist + lectures via YouTube API & store in database and local storage
  const fetchYouTubeData = async (
    roadmapId: string,
    rawTopic: string
  ): Promise<SavedYouTubePlaylist | null> => {
    const topic = rawTopic.replace(/^[×⚠✓\s]+/, "").replace(/\s*\([^)]*\)/g, "").trim();
    if (!topic) return null;

    let playlistData: SavedYouTubePlaylist | null = null;

    // 1. Fetch from backend API (which automatically queries YouTube and saves into the yt_playlist column in DB)
    try {
      const res = await api.skillTracks.getYouTubePlaylist({
        topic,
        job_id: roadmapId,
        student_id: studentId || undefined,
      });

      if (res && res.success && res.playlist) {
        playlistData = {
          topic,
          playlistId: res.playlist.playlist_id,
          title: res.playlist.title,
          channelTitle: res.playlist.channel_title,
          embedUrl: res.playlist.embed_url,
          thumbnail: res.playlist.thumbnail,
          isPlaylist: res.playlist.is_playlist,
          total_videos: (res.playlist as any).total_videos || (res.playlist as any).lectures?.length || 1,
          lectures: (res.playlist as any).lectures || [],
          completed_videos: (res.playlist as any).completed_videos || [],
        };
      }
    } catch (backendErr) {
      console.warn("Backend YouTube endpoint fallback to client fetch:", backendErr);
    }

    // 2. Client-side fallback to YouTube Data API v3 if backend was unreachable
    if (!playlistData) {
      const YT_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";
      const query = encodeURIComponent(`${topic} full course tutorial playlist`);
      try {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${query}&maxResults=1&key=${YT_KEY}`
        );

        if (ytRes.ok) {
          const ytJson = await ytRes.json();
          if (ytJson.items && ytJson.items.length > 0) {
            const item = ytJson.items[0];
            const playlistId = item.id.playlistId;

            // Also fetch playlist items for video list
            let lectures: YouTubeLecture[] = [];
            try {
              const plRes = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=25&key=${YT_KEY}`
              );
              if (plRes.ok) {
                const plJson = await plRes.json();
                lectures = (plJson.items || []).map((pItem: any, idx: number) => ({
                  id: pItem.id || `lec-${idx}`,
                  video_id: pItem.snippet?.resourceId?.videoId,
                  title: pItem.snippet?.title || `Lecture ${idx + 1}`,
                  position: pItem.snippet?.position ?? idx,
                  thumbnail: pItem.snippet?.thumbnails?.high?.url || pItem.snippet?.thumbnails?.default?.url,
                  channel_title: pItem.snippet?.channelTitle || item.snippet.channelTitle,
                  embed_url: `https://www.youtube-nocookie.com/embed/${pItem.snippet?.resourceId?.videoId}?autoplay=1&enablejsapi=1`,
                })).filter((l: YouTubeLecture) => l.video_id);
              }
            } catch (pErr) {
              console.error("Error fetching playlist items client-side:", pErr);
            }

            playlistData = {
              topic,
              playlistId,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle,
              embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1&enablejsapi=1`,
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
              isPlaylist: true,
              total_videos: lectures.length > 0 ? lectures.length : 1,
              lectures,
              completed_videos: [],
            };
          }
        }

        // Secondary fallback to single video search
        if (!playlistData) {
          const vQuery = encodeURIComponent(`${topic} full course tutorial`);
          const vRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${vQuery}&maxResults=1&key=${YT_KEY}`
          );
          if (vRes.ok) {
            const vJson = await vRes.json();
            if (vJson.items && vJson.items.length > 0) {
              const vItem = vJson.items[0];
              const videoId = vItem.id.videoId;
              playlistData = {
                topic,
                playlistId: videoId,
                title: vItem.snippet.title,
                channelTitle: vItem.snippet.channelTitle,
                embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
                thumbnail: vItem.snippet.thumbnails?.high?.url,
                isPlaylist: false,
                total_videos: 1,
                lectures: [
                  {
                    id: "single-vid",
                    video_id: videoId,
                    title: vItem.snippet.title,
                    position: 0,
                    thumbnail: vItem.snippet.thumbnails?.high?.url,
                    channel_title: vItem.snippet.channelTitle,
                    embed_url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
                  },
                ],
                completed_videos: [],
              };
            }
          }
        }
      } catch (clientErr) {
        console.error("Client YouTube fetch error:", clientErr);
      }
    }

    if (playlistData) {
      updateRoadmapYouTubePlaylist(roadmapId, topic, playlistData);
      loadRoadmaps();
    }

    return playlistData;
  };

  // Handler when user clicks on a skill topic in REQ stepwise roadmap
  // REDIRECTS directly to LEARNING LECTURES tab!
  const handleTopicClickAndRedirect = async (
    roadmapId: string,
    rawTopic: string,
    existingPlaylist?: SavedYouTubePlaylist
  ) => {
    const topic = rawTopic.replace(/^[×⚠✓\s]+/, "").replace(/\s*\([^)]*\)/g, "").trim();
    if (!topic) return;

    setSelectedRoadmapId(roadmapId);
    setSelectedTopic(topic);
    setLoadingTopic(topic);
    setVideoNotice(null);

    // Switch view to Learning Lectures immediately
    setActiveSection("lectures");

    let pData = existingPlaylist;
    // Auto-heal: if no lectures cached or only 1 item cached, re-fetch from full playlist endpoint
    if (!pData || !pData.embedUrl || !pData.lectures || pData.lectures.length <= 1) {
      pData = (await fetchYouTubeData(roadmapId, topic)) || undefined;
    }

    if (pData) {
      const firstVideoId = pData.lectures?.[0]?.video_id || pData.playlistId;
      setActiveLectureVideoId(firstVideoId);
      setActiveVideo({
        roadmapId,
        topic,
        playlistId: pData.playlistId,
        title: pData.title,
        channelTitle: pData.channelTitle,
        embedUrl: pData.lectures?.[0]?.embed_url || pData.embedUrl,
        isPlaylist: pData.isPlaylist,
      });
    } else {
      setVideoNotice(`Unable to load YouTube course for "${topic}".`);
    }

    setLoadingTopic(null);
  };

  // Toggle video lecture completion tracking
  const handleToggleLecture = async (
    roadmapId: string,
    topic: string,
    videoId: string
  ) => {
    const result = toggleVideoCompletion(roadmapId, topic, videoId);
    loadRoadmaps();

    // Persist to backend database column
    try {
      await api.skillTracks.toggleLecture({
        job_id: roadmapId,
        topic,
        video_id: videoId,
        completed: result.completed,
        student_id: studentId || undefined,
      });
    } catch (e) {
      console.warn("Backend progress sync warning:", e);
    }
  };

  // Active roadmap for lectures view
  const currentRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0];
  const currentTopicName = selectedTopic || currentRoadmap?.whatToLearn?.learningSteps?.[0]?.skill || "";
  const currentPlaylistData: SavedYouTubePlaylist | undefined = currentRoadmap?.yt_playlists?.[currentTopicName];

  // Lectures list
  const currentLectures = currentPlaylistData?.lectures || [];
  const totalLecturesCount = currentPlaylistData?.total_videos || currentLectures.length || (currentPlaylistData ? 1 : 0);
  const completedLecturesList = currentPlaylistData?.completed_videos || [];
  const completedCount = completedLecturesList.length;
  const progressPercent = totalLecturesCount > 0 ? Math.min(100, Math.round((completedCount / totalLecturesCount) * 100)) : 0;

  // Active lecture being watched
  const currentPlayingLecture = currentLectures.find((l) => l.video_id === activeLectureVideoId) || currentLectures[0];

  // Auto-heal / fetch playlist lectures if active section is lectures and topic has <= 1 video cached
  useEffect(() => {
    if (activeSection === "lectures" && currentRoadmap && currentTopicName) {
      const pData = currentRoadmap.yt_playlists?.[currentTopicName];
      if (!pData || !pData.lectures || pData.lectures.length <= 1) {
        setLoadingTopic(currentTopicName);
        fetchYouTubeData(currentRoadmap.id, currentTopicName).then((fetched) => {
          setLoadingTopic(null);
          if (fetched?.lectures && fetched.lectures.length > 0) {
            setActiveLectureVideoId(fetched.lectures[0].video_id);
          }
        });
      }
    }
  }, [activeSection, currentTopicName, currentRoadmap?.id]);

  // Keep activeLectureVideoId aligned with current playing lecture
  useEffect(() => {
    if (currentPlayingLecture && currentPlayingLecture.video_id !== activeLectureVideoId) {
      setActiveLectureVideoId(currentPlayingLecture.video_id);
    }
  }, [currentPlayingLecture?.video_id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -25 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 pb-24"
    >
      {/* 1. TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(studentId ? `/dashboard?student_id=${studentId}` : "/dashboard")}
          className="w-11 h-11 rounded-full bg-[#181822] border border-[#262634] text-white flex items-center justify-center hover:bg-[#222230] transition-transform hover:scale-105 cursor-pointer shadow-md"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 border border-teal-500/30 text-teal-300">
            {roadmaps.length} Saved {roadmaps.length === 1 ? "Role" : "Roles"}
          </span>
        </div>

        <button
          type="button"
          onClick={loadRoadmaps}
          className="w-11 h-11 rounded-full bg-[#181822] border border-[#262634] text-[#8E8E9C] hover:text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-md"
          title="Reload Saved Roadmaps"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BIG BOLD PAGE HEADING */}
      <div className="pt-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05]">
          Skill <br />
          <span className="font-light text-teal-200">Tracks</span>
        </h1>
        <p className="text-xs text-[#8E8E9C] mt-2">
          Your saved jobs, verified skills, recruiter requirements, and interactive lecture tracking system.
        </p>
      </div>

      {/* 3. SECTION SELECTOR / TABS: REQ, SAVED, AND LEARNING LECTURES */}
      <div className="flex items-center gap-2 p-1.5 bg-[#14141C] border border-[#262634] rounded-2xl flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection("req")}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "req"
              ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-rose-500/25 font-extrabold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListChecks className="w-4 h-4 text-rose-400" />
          <span>REQ (Job Requirements &amp; What to Learn)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("saved")}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "saved"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 font-extrabold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Briefcase className="w-4 h-4 text-purple-400" />
          <span>SAVED (Saved Jobs &amp; My Skills)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("lectures")}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "lectures"
              ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 font-extrabold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <GraduationCap className="w-4 h-4 text-teal-400" />
          <span>LEARNING LECTURES</span>
          {completedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/40 text-emerald-300 border border-emerald-500/40">
              {completedCount}/{totalLecturesCount}
            </span>
          )}
        </button>
      </div>

      {videoNotice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span>{videoNotice}</span>
          <button onClick={() => setVideoNotice(null)} className="text-amber-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. CONTENT LIST */}
      <div className="space-y-6">
        {!isLoaded ? (
          <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-teal-400 mb-2" />
            <span>Loading Skill Tracks...</span>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="py-20 px-4 text-center flex flex-col items-center justify-center rounded-3xl bg-[#14141C] border border-[#262634]">
            <div className="w-16 h-16 rounded-2xl bg-[#1D1D28] border border-white/10 flex items-center justify-center text-teal-400 mb-4 shadow-md">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              No Saved Jobs in Skill Tracks Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Explore Job Pathways, click on any role fit analysis, and hit <strong>Save Roadmap</strong> to track your job details, skills, and requirements right here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/jobs")}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
            >
              <span>Explore Jobs &amp; Roadmaps</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* ==================================================================================== */}
            {/* SECTION: LEARNING LECTURES WITH FULL TRACKING SYSTEM                               */}
            {/* ==================================================================================== */}
            {activeSection === "lectures" && currentRoadmap && (
              <div className="rounded-3xl bg-[#140A12] border border-teal-500/40 p-6 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-900/15 blur-3xl pointer-events-none" />

                {/* Header: Role & Topic Selector */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#281321] flex-wrap relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider">
                        LECTURES SYSTEM
                      </span>
                      <span className="text-xs text-teal-300 font-bold">
                        {currentRoadmap.job.title} · {currentRoadmap.job.company}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Learning Lectures: <span className="text-teal-300">{currentTopicName || "Select a Skill"}</span>
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection("req")}
                    className="px-3.5 py-1.5 rounded-xl bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Back to REQ Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Skill Step Selector Pills */}
                <div className="space-y-2 relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Choose Skill Roadmap Topic:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentRoadmap.whatToLearn?.learningSteps?.map((step, idx) => {
                      const isSelected = currentTopicName.toLowerCase() === step.skill.toLowerCase();
                      const topicData = currentRoadmap.yt_playlists?.[step.skill];
                      const comp = topicData?.completed_videos?.length || 0;
                      const tot = topicData?.total_videos || topicData?.lectures?.length || 0;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleTopicClickAndRedirect(currentRoadmap.id, step.skill, topicData)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                            isSelected
                              ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400 shadow-md scale-105"
                              : "bg-[#20101D] hover:bg-[#2C1729] text-slate-300 border-[#351E2D]"
                          }`}
                        >
                          <span>{step.skill}</span>
                          {tot > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                comp === tot && tot > 0
                                  ? "bg-emerald-400/30 text-emerald-200"
                                  : "bg-black/40 text-slate-300"
                              }`}
                            >
                              {comp}/{tot}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FULL PROGRESS TRACKING SYSTEM DASHBOARD */}
                <div className="p-5 rounded-2xl bg-[#1C0D17]/90 border border-teal-500/30 space-y-4 shadow-inner relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-teal-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Course Progress Tracker
                      </h3>
                      <button
                        type="button"
                        onClick={async () => {
                          setLoadingTopic(currentTopicName);
                          const fetched = await fetchYouTubeData(currentRoadmap.id, currentTopicName);
                          setLoadingTopic(null);
                          if (fetched?.lectures && fetched.lectures.length > 0) {
                            setActiveLectureVideoId(fetched.lectures[0].video_id);
                          }
                        }}
                        disabled={loadingTopic === currentTopicName}
                        className="ml-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Re-sync full playlist from YouTube"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingTopic === currentTopicName ? "animate-spin text-teal-400" : ""}`} />
                        <span>{loadingTopic === currentTopicName ? "Syncing..." : "Re-sync"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-300">
                        Total Videos: <strong className="text-white font-bold">{totalLecturesCount}</strong>
                      </span>
                      <span className="text-emerald-400">
                        Completed: <strong className="font-bold">{completedCount}</strong>
                      </span>
                      <span className="text-slate-400">
                        Remaining: <strong className="font-bold">{Math.max(0, totalLecturesCount - completedCount)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Completion Rate</span>
                      <span className="text-teal-300">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 shadow-lg"
                      />
                    </div>
                  </div>

                  {progressPercent === 100 && totalLecturesCount > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Congratulations! You have completed all lecture videos for this skill!</span>
                    </div>
                  )}
                </div>

                {/* ACTIVE EMBEDDED YOUTUBE VIDEO PLAYER */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1C0D17] via-black to-[#140A12] border border-white/15 shadow-2xl space-y-4 relative z-10">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
                        <Play className="w-4 h-4 fill-white" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-red-400 tracking-wider">
                            Now Watching
                          </span>
                          {currentPlayingLecture && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              Lecture {currentPlayingLecture.position + 1} of {totalLecturesCount}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-white line-clamp-1">
                          {currentPlayingLecture?.title || currentPlaylistData?.title || `${currentTopicName} Course`}
                        </h4>
                      </div>
                    </div>

                    {/* Quick Toggle Done for active video */}
                    {currentPlayingLecture && (
                      <button
                        type="button"
                        onClick={() => handleToggleLecture(currentRoadmap.id, currentTopicName, currentPlayingLecture.video_id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          completedLecturesList.includes(currentPlayingLecture.video_id)
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
                            : "bg-[#281321] hover:bg-[#351E2D] border border-teal-500/40 text-teal-300 hover:text-white"
                        }`}
                      >
                        {completedLecturesList.includes(currentPlayingLecture.video_id) ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Completed ✓</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            <span>Mark Lecture Completed</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* YOUTUBE IFRAME */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 bg-black shadow-2xl">
                    <iframe
                      src={
                        currentPlayingLecture?.embed_url ||
                        (activeLectureVideoId
                          ? `https://www.youtube-nocookie.com/embed/${activeLectureVideoId}?autoplay=1&enablejsapi=1`
                          : currentPlaylistData?.embedUrl || "https://www.youtube-nocookie.com/embed")
                      }
                      title={currentPlayingLecture?.title || "Course Video"}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
                    <span className="text-slate-300">
                      <strong>Channel:</strong> {currentPlayingLecture?.channel_title || currentPlaylistData?.channelTitle || "YouTube"}
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      {currentPlayingLecture?.video_id && (
                        <a
                          href={`https://www.youtube.com/watch?v=${currentPlayingLecture.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 flex items-center gap-1.5 font-bold transition-all text-xs"
                        >
                          <span>Open Video in YouTube</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {currentPlaylistData?.playlistId && (
                        <a
                          href={`https://www.youtube.com/playlist?list=${currentPlaylistData.playlistId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                        >
                          <span>Open Complete Playlist</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Helpful Brave Shields / Adblock notice */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#20101D] border border-teal-500/20 text-[11px] text-slate-300">
                    <Info className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>
                      <strong className="text-teal-300">Brave Shields / Adblock note:</strong> YouTube Privacy-Enhanced mode is active. If your browser shields block player telemetry, videos still play or you can use the direct YouTube link above.
                    </span>
                  </div>
                </div>

                {/* LECTURES LIST WITH INDIVIDUAL TRACKING CHECKBOXES */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Tv className="w-4 h-4 text-teal-400" />
                      <span>All Video Lectures ({currentLectures.length})</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Click any lecture to play or mark completed
                    </span>
                  </div>

                  {currentLectures.length === 0 ? (
                    <div className="p-8 text-center bg-black/40 rounded-2xl border border-white/5 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-400 mx-auto" />
                      <p className="text-xs text-slate-300">Fetching lecture playlist for {currentTopicName}...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {currentLectures.map((lec, lIdx) => {
                        const isDone = completedLecturesList.includes(lec.video_id);
                        const isPlaying = (activeLectureVideoId || currentLectures[0].video_id) === lec.video_id;

                        return (
                          <div
                            key={lec.id || lIdx}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none ${
                              isPlaying
                                ? "bg-gradient-to-r from-teal-950/50 to-[#1C0D17] border-teal-500 shadow-md"
                                : isDone
                                ? "bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/30"
                                : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60"
                            }`}
                          >
                            {/* Click to play */}
                            <div
                              onClick={() => {
                                setActiveLectureVideoId(lec.video_id);
                              }}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                  isPlaying
                                    ? "bg-teal-500 text-white shadow-md"
                                    : isDone
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-white/10 text-slate-300"
                                }`}
                              >
                                {isPlaying ? (
                                  <Volume2 className="w-4 h-4 animate-bounce" />
                                ) : (
                                  <span>#{lIdx + 1}</span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4
                                  className={`text-xs sm:text-sm font-bold truncate ${
                                    isPlaying ? "text-teal-300" : isDone ? "text-emerald-200" : "text-white"
                                  }`}
                                >
                                  {lec.title}
                                </h4>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {lec.channel_title || "YouTube Course"}
                                </span>
                              </div>
                            </div>

                            {/* Mark completed button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLecture(currentRoadmap.id, currentTopicName, lec.video_id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                isDone
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                  : "bg-[#281321] hover:bg-[#351E2D] border border-white/10 text-slate-400 hover:text-white"
                              }`}
                            >
                              {isDone ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                  <span>Done</span>
                                </>
                              ) : (
                                <>
                                  <Square className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Mark Done</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================================================================================== */}
            {/* OTHER SECTIONS: REQ & SAVED                                                          */}
            {/* ==================================================================================== */}
            {activeSection !== "lectures" &&
              roadmaps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-[#140A12] border border-[#351E2D] p-6 space-y-6 shadow-xl relative overflow-hidden"
                >
                  {/* Ambient Lighting */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-900/10 blur-3xl pointer-events-none" />

                  {/* Card Header: Role info, Apply & Delete */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#281321] flex-wrap relative z-10">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {item.job.title}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                        <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                          <Building className="w-4 h-4 text-amber-400" />
                          {item.job.company}
                        </span>
                        {item.job.location && (
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            {item.job.location}
                          </span>
                        )}
                        {item.job.salary && (
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                            {item.job.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.job.applyLink && (
                        <a
                          href={item.job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Apply on Jooble</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Remove saved job"
                        className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/30 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* SECTION 1: REQ */}
                  {activeSection === "req" && (
                    <div className="p-5 rounded-2xl bg-[#1C0D17]/90 border border-amber-500/30 space-y-5 shadow-inner relative z-10">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                            SECTION 1
                          </span>
                          <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-amber-400" />
                            <span>REQ (Job Requirements &amp; What to Learn)</span>
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Recruiter Requirements Sync
                        </span>
                      </div>

                      {/* All Job Skill Requirements */}
                      {item.requirements?.allRequiredSkills && item.requirements.allRequiredSkills.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                            Full Job Skill Requirements:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.requirements.allRequiredSkills.map((req, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-slate-300 text-xs font-medium"
                              >
                                • {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WHAT TO LEARN: Missing Requirements */}
                      {item.whatToLearn.missingSkills && item.whatToLearn.missingSkills.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                              <XCircle className="w-4 h-4 text-rose-400" />
                              <span>WHAT TO LEARN: Missing Requirements</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Click any skill to open lectures
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {item.whatToLearn.missingSkills.map((mSkill, mIdx) => {
                              const cleanName = mSkill.replace(/^[×⚠✓\s]+/, "").replace(/\s*\([^)]*\)/g, "").trim();
                              return (
                                <button
                                  key={mIdx}
                                  type="button"
                                  onClick={() => handleTopicClickAndRedirect(item.id, mSkill, item.yt_playlists?.[cleanName])}
                                  className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer bg-rose-950/50 hover:bg-rose-900/60 border-rose-500/40 text-rose-300 hover:scale-105"
                                >
                                  <span className="text-rose-400 font-black">×</span>
                                  <span>{mSkill}</span>
                                  <GraduationCap className="w-3 h-3 text-teal-400 ml-0.5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Needs Development */}
                      {item.whatToLearn.needsDevelopment && item.whatToLearn.needsDevelopment.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span>Proficiency Gaps (Needs Development)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.whatToLearn.needsDevelopment.map((pSkill, pIdx) => {
                              const cleanName = pSkill.replace(/^[×⚠✓\s]+/, "").replace(/\s*\([^)]*\)/g, "").trim();
                              return (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleTopicClickAndRedirect(item.id, cleanName, item.yt_playlists?.[cleanName])}
                                  className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-105"
                                >
                                  <span className="text-amber-400 font-black">⚠</span>
                                  <span>{pSkill}</span>
                                  <GraduationCap className="w-3 h-3 text-teal-400 ml-0.5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* STEPWISE LEARNING ROADMAP (CLICK TO REDIRECT TO LECTURES) */}
                      {item.whatToLearn.learningSteps && item.whatToLearn.learningSteps.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-[#281321]">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold uppercase text-cyan-300 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-cyan-400" />
                              <span>Step-by-Step Learning Roadmap (Click to Open Lectures):</span>
                            </span>
                            <span className="text-[11px] text-teal-300 font-semibold flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Opens Learning Lectures &amp; Tracker</span>
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {item.whatToLearn.learningSteps.map((step, stIdx) => {
                              const hasSaved = !!item.yt_playlists?.[step.skill];
                              const pData = item.yt_playlists?.[step.skill];
                              const comp = pData?.completed_videos?.length || 0;
                              const tot = pData?.total_videos || pData?.lectures?.length || 0;

                              return (
                                <div
                                  key={stIdx}
                                  onClick={() => handleTopicClickAndRedirect(item.id, step.skill, item.yt_playlists?.[step.skill])}
                                  className="p-4 rounded-2xl border border-white/10 hover:border-teal-400 bg-black/40 hover:bg-black/70 transition-all cursor-pointer select-none group shadow-sm hover:scale-[1.01]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                        {step.sequence || stIdx + 1}
                                      </div>

                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-sm text-white group-hover:text-teal-300 transition-colors">
                                            {step.skill}
                                          </span>
                                          {tot > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                              {comp}/{tot} Completed
                                            </span>
                                          )}
                                        </div>
                                        {step.focus && step.focus.length > 0 && (
                                          <p className="text-xs text-slate-300 leading-relaxed">
                                            <strong className="text-cyan-400 font-semibold">Focus:</strong>{" "}
                                            {step.focus.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1.5">
                                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/40 group-hover:bg-gradient-to-r group-hover:from-teal-500 group-hover:to-emerald-600 group-hover:text-white transition-all flex items-center gap-1.5 shadow-sm">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        <span>Open Lectures →</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recommended Bridge Project */}
                      {item.whatToLearn.projectRecommendation && (
                        <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/30 text-xs text-slate-200 space-y-1.5">
                          <span className="text-xs font-bold uppercase text-purple-300 flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-purple-400" />
                            <span>Recommended Portfolio Project to Bridge Requirements:</span>
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {item.whatToLearn.projectRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: SAVED */}
                  {activeSection === "saved" && (
                    <div className="p-5 rounded-2xl bg-[#20101D]/90 border border-purple-500/30 space-y-4 shadow-inner relative z-10">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                            SECTION 2
                          </span>
                          <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-purple-400" />
                            <span>SAVED (Saved Job &amp; My Skills)</span>
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          Saved Role Overview
                        </span>
                      </div>

                      {/* Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-black/40 p-3.5 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Job Role</span>
                          <span className="font-semibold text-white text-xs">{item.job.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Hiring Company</span>
                          <span className="font-semibold text-white text-xs">{item.job.company}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Work Location</span>
                          <span className="font-semibold text-white text-xs">{item.job.location || "India"}</span>
                        </div>
                      </div>

                      {/* WHAT SKILLS I HAVE */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>WHAT SKILLS I HAVE (Verified Strengths)</span>
                        </div>

                        {item.skillsIHave && item.skillsIHave.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.skillsIHave.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                              >
                                <span className="text-emerald-400 font-black">✓</span>
                                <span>{skill}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No verified skills recorded.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function SkillTracksPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-3" />
          <p className="text-xs text-[#8E8E9C]">Loading Skill Tracks...</p>
        </div>
      }
    >
      <SkillTracksPageContent />
    </Suspense>
  );
}
