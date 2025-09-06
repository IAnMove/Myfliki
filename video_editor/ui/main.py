import sys
from typing import Tuple

from PyQt5.QtWidgets import (
    QApplication,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QFileDialog,
    QListWidget,
    QSlider,
    QLabel,
    QMessageBox,
    QComboBox,
)

from ..application.video_service import VideoService
from ..domain.clip import Transition


class VideoEditorUI(QWidget):
    def __init__(self):
        super().__init__()
        self.service = VideoService()
        self.setWindowTitle("Clean Video Editor")
        self.resize(800, 600)

        main_layout = QVBoxLayout()

        # controls
        controls = QHBoxLayout()
        btn_img = QPushButton("Add Image")
        btn_vid = QPushButton("Add Video")
        btn_audio = QPushButton("Add Audio")
        btn_play = QPushButton("Play")
        btn_export = QPushButton("Export")
        controls.addWidget(btn_img)
        controls.addWidget(btn_vid)
        controls.addWidget(btn_audio)
        controls.addWidget(btn_play)
        controls.addWidget(btn_export)

        btn_img.clicked.connect(self.add_image)
        btn_vid.clicked.connect(self.add_video)
        btn_audio.clicked.connect(self.add_audio)
        btn_play.clicked.connect(self.play)
        btn_export.clicked.connect(self.export)

        # list of clips
        self.list_widget = QListWidget()

        # timeline slider
        timeline_layout = QHBoxLayout()
        timeline_layout.addWidget(QLabel("Timeline:"))
        self.slider = QSlider()
        self.slider.setOrientation(1)
        self.slider.setMinimum(0)
        self.slider.setMaximum(100)
        timeline_layout.addWidget(self.slider)

        # resolution selector
        res_layout = QHBoxLayout()
        res_layout.addWidget(QLabel("Resolution:"))
        self.res_combo = QComboBox()
        self.res_combo.addItems(["640x480", "1280x720", "1920x1080"])
        res_layout.addWidget(self.res_combo)

        main_layout.addLayout(controls)
        main_layout.addWidget(self.list_widget)
        main_layout.addLayout(timeline_layout)
        main_layout.addLayout(res_layout)
        self.setLayout(main_layout)

    # helpers
    def _current_resolution(self) -> Tuple[int, int]:
        text = self.res_combo.currentText()
        w, h = text.split("x")
        return int(w), int(h)

    # slots
    def add_image(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select image", "", "Images (*.png *.jpg *.jpeg)")
        if path:
            transition = Transition(name="crossfade", duration=1.0)
            self.service.add_image(path, transition=transition)
            self.list_widget.addItem(f"Image: {path}")

    def add_video(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select video", "", "Videos (*.mp4 *.mov *.avi)")
        if path:
            self.service.add_video(path)
            self.list_widget.addItem(f"Video: {path}")

    def add_audio(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select audio", "", "Audio (*.mp3 *.wav)")
        if path:
            self.service.set_audio(path)
            self.list_widget.addItem(f"Audio: {path}")

    def play(self):
        res = self._current_resolution()
        try:
            self.service.play(res)
        except Exception as exc:
            QMessageBox.critical(self, "Error", str(exc))

    def export(self):
        res = self._current_resolution()
        path, _ = QFileDialog.getSaveFileName(self, "Save Video", "", "Videos (*.mp4)")
        if path:
            try:
                self.service.export(path, res)
                QMessageBox.information(self, "Done", "Video exported successfully")
            except Exception as exc:
                QMessageBox.critical(self, "Error", str(exc))


if __name__ == "__main__":
    app = QApplication(sys.argv)
    ui = VideoEditorUI()
    ui.show()
    sys.exit(app.exec_())
