"""
In-Game Pause Overlay Controller
"""


class PauseMenuUI:
    def __init__(self):
        self.is_paused = False

    def toggle(self) -> bool:
        self.is_paused = not self.is_paused
        return self.is_paused

    def resume(self) -> None:
        self.is_paused = False
