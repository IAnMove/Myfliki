"""Application layer orchestrating timeline operations."""
from typing import Tuple

from ..domain.clip import Clip, ClipType, Transition
from ..domain.timeline import Timeline
from ..infrastructure.moviepy_adapter import (
    build_video_clip,
    export_clip,
    preview_clip,
)


class VideoService:
    def __init__(self, timeline: Timeline | None = None):
        self.timeline = timeline or Timeline()

    # Use cases
    def add_image(self, path: str, duration: float = 2.0, transition: Transition | None = None) -> None:
        self.timeline.clips.append(Clip(path=path, type=ClipType.IMAGE, duration=duration, transition=transition))

    def add_video(self, path: str, transition: Transition | None = None) -> None:
        self.timeline.clips.append(Clip(path=path, type=ClipType.VIDEO, transition=transition))

    def set_audio(self, path: str) -> None:
        self.timeline.audio_path = path

    def play(self, resolution: Tuple[int, int]) -> None:
        clip = build_video_clip(self.timeline, resolution)
        preview_clip(clip)

    def export(self, path: str, resolution: Tuple[int, int]) -> None:
        clip = build_video_clip(self.timeline, resolution)
        export_clip(clip, path)
