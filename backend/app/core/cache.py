import time
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.profile import Scholarship

class AppCache:
    def __init__(self):
        # 1. Raw scholarships cache
        self._scholarships: Optional[List[Scholarship]] = None
        self._scholarships_ts: float = 0
        self._scholarships_ttl: float = 600.0  # 10 minutes

        # 2. Personalized evaluated scholarships cache: student_id -> (timestamp, List)
        self._personalized: Dict[str, tuple[float, List[Any]]] = {}
        self._personalized_ttl: float = 300.0  # 5 minutes

        # 3. Preview scholarships cache: cache_key -> (timestamp, List)
        self._previews: Dict[str, tuple[float, List[Any]]] = {}
        self._previews_ttl: float = 600.0  # 10 minutes

        # 4. Student profile response cache: student_id -> (timestamp, profile_response)
        self._profiles: Dict[str, tuple[float, Any]] = {}
        self._profiles_ttl: float = 300.0  # 5 minutes

    def get_scholarships(self, db: Session) -> List[Scholarship]:
        """Returns cached scholarships or fetches from DB once every TTL."""
        now = time.time()
        if self._scholarships is not None and (now - self._scholarships_ts) < self._scholarships_ttl:
            return self._scholarships

        scholarships = db.query(Scholarship).all()
        for s in scholarships:
            try:
                db.expunge(s)
            except Exception:
                pass
        self._scholarships = scholarships
        self._scholarships_ts = now
        return scholarships

    def warm_up(self, db: Session):
        """Preloads cache during server startup."""
        self.get_scholarships(db)

    def get_personalized(self, student_id: str) -> Optional[List[Any]]:
        entry = self._personalized.get(student_id)
        if entry:
            ts, data = entry
            if (time.time() - ts) < self._personalized_ttl:
                return data
        return None

    def set_personalized(self, student_id: str, data: List[Any]):
        self._personalized[student_id] = (time.time(), data)

    def get_preview(self, key: str) -> Optional[List[Any]]:
        entry = self._previews.get(key)
        if entry:
            ts, data = entry
            if (time.time() - ts) < self._previews_ttl:
                return data
        return None

    def set_preview(self, key: str, data: List[Any]):
        self._previews[key] = (time.time(), data)

    def get_profile(self, student_id: str) -> Optional[Any]:
        entry = self._profiles.get(student_id)
        if entry:
            ts, data = entry
            if (time.time() - ts) < self._profiles_ttl:
                return data
        return None

    def set_profile(self, student_id: str, data: Any):
        self._profiles[student_id] = (time.time(), data)

    def invalidate_student(self, student_id: str):
        """Invalidates student's cached profile and personalized scholarship evaluations."""
        self._personalized.pop(student_id, None)
        self._profiles.pop(student_id, None)

    def clear_scholarships(self):
        """Clears all scholarship and preview caches (e.g. after seed update)."""
        self._scholarships = None
        self._scholarships_ts = 0
        self._personalized.clear()
        self._previews.clear()

cache = AppCache()
