from dataclasses import dataclass, field
from typing import List, Optional

from .clip import Clip


@dataclass
class Timeline:
    """Represents an ordered collection of clips with an optional audio track."""
    clips: List[Clip] = field(default_factory=list)
    audio_path: Optional[str] = None
