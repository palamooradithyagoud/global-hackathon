import json
import httpx
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.skill_track import SkillTrack

router = APIRouter(prefix="/skill-tracks", tags=["Skill Tracks"])


class YouTubePlaylistRequest(BaseModel):
    topic: str
    job_id: Optional[str] = None
    skill_track_id: Optional[str] = None
    student_id: Optional[str] = None


class SaveSkillTrackRequest(BaseModel):
    id: Optional[str] = None
    student_id: Optional[str] = None
    job_id: str
    job_title: str
    company: str
    location: Optional[str] = "India"
    salary: Optional[str] = None
    apply_link: Optional[str] = None
    skills_i_have: Optional[List[str]] = None
    requirements: Optional[Dict[str, Any]] = None
    what_to_learn: Optional[Dict[str, Any]] = None
    yt_playlist: Optional[Dict[str, Any]] = None


@router.post("/youtube-playlist")
async def get_and_store_youtube_playlist(
    payload: YouTubePlaylistRequest,
    db: Session = Depends(get_db)
):
    """
    Queries YouTube Data API v3 for the top 1 playlist for the requested topic/skill,
    stores it in the database in the yt_playlist column of the skill track,
    and returns the playlist info with iframe embed URL.
    """
    topic = payload.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    api_key = settings.YOUTUBE_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="YouTube API Key is not configured")

    playlist_data = None

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Search for best top 1 Playlist
        query = f"{topic} full course tutorial playlist"
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "type": "playlist",
            "q": query,
            "maxResults": 1,
            "key": api_key
        }

        try:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if items:
                    item = items[0]
                    playlist_id = item.get("id", {}).get("playlistId")
                    snippet = item.get("snippet", {})
                    if playlist_id:
                        lectures = []
                        try:
                            pl_url = "https://www.googleapis.com/youtube/v3/playlistItems"
                            pl_params = {
                                "part": "snippet,contentDetails",
                                "playlistId": playlist_id,
                                "maxResults": 25,
                                "key": api_key
                            }
                            pl_resp = await client.get(pl_url, params=pl_params)
                            if pl_resp.status_code == 200:
                                pl_data = pl_resp.json()
                                pl_items = pl_data.get("items", [])
                                for p_idx, p_item in enumerate(pl_items):
                                    vid_id = p_item.get("snippet", {}).get("resourceId", {}).get("videoId")
                                    if vid_id:
                                        lectures.append({
                                            "id": p_item.get("id", f"lec-{p_idx}"),
                                            "video_id": vid_id,
                                            "title": p_item.get("snippet", {}).get("title", f"Lecture {p_idx+1}"),
                                            "position": p_item.get("snippet", {}).get("position", p_idx),
                                            "thumbnail": p_item.get("snippet", {}).get("thumbnails", {}).get("high", {}).get("url") or p_item.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url"),
                                            "channel_title": p_item.get("snippet", {}).get("channelTitle", snippet.get("channelTitle", "YouTube")),
                                            "embed_url": f"https://www.youtube-nocookie.com/embed/{vid_id}?autoplay=1&enablejsapi=1"
                                        })
                        except Exception as e:
                            print(f"Error fetching playlistItems: {e}")

                        playlist_data = {
                            "topic": topic,
                            "playlist_id": playlist_id,
                            "title": snippet.get("title", f"{topic} Course"),
                            "channel_title": snippet.get("channelTitle", "YouTube"),
                            "description": snippet.get("description", ""),
                            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url") or snippet.get("thumbnails", {}).get("default", {}).get("url"),
                            "embed_url": f"https://www.youtube-nocookie.com/embed/videoseries?list={playlist_id}&autoplay=1&enablejsapi=1",
                            "is_playlist": True,
                            "total_videos": len(lectures) if lectures else 1,
                            "lectures": lectures,
                            "completed_videos": []
                        }
        except Exception as e:
            print(f"Error querying YouTube playlist API: {e}")

        # 2. Fallback to video search if playlist returned empty
        if not playlist_data:
            try:
                video_params = {
                    "part": "snippet",
                    "type": "video",
                    "q": f"{topic} full course tutorial",
                    "maxResults": 1,
                    "key": api_key
                }
                v_resp = await client.get(url, params=video_params)
                if v_resp.status_code == 200:
                    v_data = v_resp.json()
                    v_items = v_data.get("items", [])
                    if v_items:
                        v_item = v_items[0]
                        video_id = v_item.get("id", {}).get("videoId")
                        v_snippet = v_item.get("snippet", {})
                        if video_id:
                            playlist_data = {
                                "topic": topic,
                                "video_id": video_id,
                                "playlist_id": video_id,
                                "title": v_snippet.get("title", f"{topic} Course Tutorial"),
                                "channel_title": v_snippet.get("channelTitle", "YouTube"),
                                "description": v_snippet.get("description", ""),
                                "thumbnail": v_snippet.get("thumbnails", {}).get("high", {}).get("url") or v_snippet.get("thumbnails", {}).get("default", {}).get("url"),
                                "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}?autoplay=1&enablejsapi=1",
                                "is_playlist": False,
                                "total_videos": 1,
                                "lectures": [
                                    {
                                        "id": "single-vid",
                                        "video_id": video_id,
                                        "title": v_snippet.get("title", f"{topic} Full Lecture"),
                                        "position": 0,
                                        "thumbnail": v_snippet.get("thumbnails", {}).get("high", {}).get("url"),
                                        "channel_title": v_snippet.get("channelTitle", "YouTube"),
                                        "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}?autoplay=1&enablejsapi=1"
                                    }
                                ],
                                "completed_videos": []
                            }
            except Exception as e:
                print(f"Error querying YouTube video fallback API: {e}")

    if not playlist_data:
        raise HTTPException(status_code=404, detail="No YouTube playlist or video found for this topic")

    # 3. Store in database in the `yt_playlist` column of the SkillTrack
    target_track = None
    if payload.skill_track_id:
        target_track = db.query(SkillTrack).filter(SkillTrack.id == payload.skill_track_id).first()
    elif payload.job_id:
        query = db.query(SkillTrack).filter(SkillTrack.job_id == payload.job_id)
        if payload.student_id:
            query = query.filter(SkillTrack.student_id == payload.student_id)
        target_track = query.first()

    if target_track:
        current_map = {}
        if target_track.yt_playlist:
            try:
                current_map = json.loads(target_track.yt_playlist)
            except Exception:
                current_map = {}
        current_map[topic] = playlist_data
        target_track.yt_playlist = json.dumps(current_map)
        db.commit()
        db.refresh(target_track)

    return {
        "success": True,
        "playlist": playlist_data,
        "saved_in_database": target_track is not None
    }


@router.post("/save")
def save_skill_track(payload: SaveSkillTrackRequest, db: Session = Depends(get_db)):
    """
    Saves or updates a skill track in the database.
    """
    track = None
    if payload.id:
        track = db.query(SkillTrack).filter(SkillTrack.id == payload.id).first()
    if not track and payload.job_id:
        track = db.query(SkillTrack).filter(
            SkillTrack.job_id == payload.job_id,
            SkillTrack.student_id == payload.student_id
        ).first()

    if not track:
        track = SkillTrack(
            job_id=payload.job_id,
            student_id=payload.student_id,
            job_title=payload.job_title,
            company=payload.company,
            location=payload.location,
            salary=payload.salary,
            apply_link=payload.apply_link,
            skills_i_have=json.dumps(payload.skills_i_have) if payload.skills_i_have else None,
            requirements=json.dumps(payload.requirements) if payload.requirements else None,
            what_to_learn=json.dumps(payload.what_to_learn) if payload.what_to_learn else None,
            yt_playlist=json.dumps(payload.yt_playlist) if payload.yt_playlist else None,
        )
        db.add(track)
    else:
        track.job_title = payload.job_title
        track.company = payload.company
        track.location = payload.location
        track.salary = payload.salary
        track.apply_link = payload.apply_link
        if payload.skills_i_have is not None:
            track.skills_i_have = json.dumps(payload.skills_i_have)
        if payload.requirements is not None:
            track.requirements = json.dumps(payload.requirements)
        if payload.what_to_learn is not None:
            track.what_to_learn = json.dumps(payload.what_to_learn)
        if payload.yt_playlist is not None:
            track.yt_playlist = json.dumps(payload.yt_playlist)

    db.commit()
    db.refresh(track)
    return {"success": True, "id": track.id, "job_id": track.job_id}


@router.get("")
def get_skill_tracks(student_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Retrieves saved skill tracks with their stored YouTube playlists.
    """
    query = db.query(SkillTrack)
    if student_id:
        query = query.filter(SkillTrack.student_id == student_id)
    tracks = query.order_by(SkillTrack.created_at.desc()).all()

    result = []
    for t in tracks:
        result.append({
            "id": t.id,
            "job_id": t.job_id,
            "student_id": t.student_id,
            "job_title": t.job_title,
            "company": t.company,
            "location": t.location,
            "salary": t.salary,
            "apply_link": t.apply_link,
            "skills_i_have": json.loads(t.skills_i_have) if t.skills_i_have else [],
            "requirements": json.loads(t.requirements) if t.requirements else {},
            "what_to_learn": json.loads(t.what_to_learn) if t.what_to_learn else {},
            "yt_playlist": json.loads(t.yt_playlist) if t.yt_playlist else {},
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    return result


class ToggleLectureProgressRequest(BaseModel):
    job_id: str
    topic: str
    video_id: str
    completed: bool
    student_id: Optional[str] = None


@router.post("/toggle-lecture")
def toggle_lecture_progress(payload: ToggleLectureProgressRequest, db: Session = Depends(get_db)):
    """
    Toggles completion of a video lecture and persists progress in the skill_track database column.
    """
    query = db.query(SkillTrack).filter(SkillTrack.job_id == payload.job_id)
    if payload.student_id:
        query = query.filter(SkillTrack.student_id == payload.student_id)
    track = query.first()

    if not track:
        return {"success": False, "message": "Skill track not found in database"}

    current_map = {}
    if track.yt_playlist:
        try:
            current_map = json.loads(track.yt_playlist)
        except Exception:
            current_map = {}

    topic_data = current_map.get(payload.topic, {})
    completed = set(topic_data.get("completed_videos", []))
    if payload.completed:
        completed.add(payload.video_id)
    else:
        completed.discard(payload.video_id)

    topic_data["completed_videos"] = list(completed)
    current_map[payload.topic] = topic_data
    track.yt_playlist = json.dumps(current_map)
    db.commit()

    return {
        "success": True,
        "topic": payload.topic,
        "completed_videos": list(completed),
        "total_completed": len(completed),
    }

