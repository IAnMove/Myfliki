# Clean Architecture Video Editor

This sample application demonstrates a minimal video editor built with Python and PyQt5 following a simplified clean architecture.

## Features
- Add images, videos and a single audio track.
- Apply a basic crossfade transition to images (extensible for more effects).
- Timeline slider mockup.
- Play preview and export final video.
- Choose export resolution (640x480, 1280x720, 1920x1080).

## Usage
1. Install dependencies:
   ```bash
   pip install pyqt5 moviepy
   ```
2. Run the editor:
   ```bash
   python -m video_editor.ui.main
   ```
3. Add media through buttons, select resolution, play or export.

## Extending
Transitions are represented by the `Transition` dataclass. New effects can be added by extending `moviepy_adapter.py` and using different transition names.
