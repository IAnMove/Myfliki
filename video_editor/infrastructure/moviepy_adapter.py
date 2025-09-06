"""Infrastructure functions using moviepy for video operations."""
from __future__ import annotations

from typing import Tuple

from moviepy.editor import (
    AudioFileClip,
    ImageClip,
    VideoFileClip,
    concatenate_videoclips,
)

from ..domain.clip import Clip, ClipType
from ..domain.timeline import Timeline


def _to_moviepy_clip(clip: Clip, resolution: Tuple[int, int]):
    if clip.type == ClipType.IMAGE:
        base = ImageClip(clip.path, duration=clip.duration)
    else:
        base = VideoFileClip(clip.path)
    return base.resize(newsize=resolution)


def build_video_clip(timeline: Timeline, resolution: Tuple[int, int]):
    moviepy_clips = []
    for clip in timeline.clips:
        c = _to_moviepy_clip(clip, resolution)
        if clip.transition and clip.transition.name == "crossfade":
            c = c.crossfadein(clip.transition.duration)
        moviepy_clips.append((c, clip.transition))

    if not moviepy_clips:
        return None

    final, _ = moviepy_clips[0]
    for next_clip, transition in moviepy_clips[1:]:
        if transition and transition.name == "crossfade":
            final = concatenate_videoclips([final, next_clip], padding=-transition.duration)
        else:
            final = concatenate_videoclips([final, next_clip])

    if timeline.audio_path:
        final = final.set_audio(AudioFileClip(timeline.audio_path))
    return final


def preview_clip(clip):
    if clip:
        clip.preview()


def export_clip(clip, path: str):
    if clip:
        clip.write_videofile(path, fps=24)
