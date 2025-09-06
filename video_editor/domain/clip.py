from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ClipType(Enum):
    """Types of supported clips."""
    IMAGE = "image"
    VIDEO = "video"


@dataclass
class Transition:
    """Represents a transition effect between clips."""
    name: str
    duration: float = 1.0


@dataclass
class Clip:
    """Domain entity for a media clip."""
    path: str
    type: ClipType
    duration: float = 2.0  # Only used for images
    transition: Optional[Transition] = None
