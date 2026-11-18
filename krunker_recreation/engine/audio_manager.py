"""Audio manager module for Panda3D sound synthesis / playback."""

class AudioManager:
    def __init__(self, master_volume=0.8, sfx_volume=0.85):
        self.master_volume = master_volume
        self.sfx_volume = sfx_volume
        self.sound_cache = {}
        self.is_muted = False

    def play_sound(self, sound_name, volume_scale=1.0):
        if self.is_muted:
            return
        effective_vol = self.master_volume * self.sfx_volume * volume_scale
        # When running in Panda3D, uses base.loader.loadSfx()
        # Fallback print in headless mode
        # print(f"[Audio] Playing {sound_name} at volume {effective_vol:.2f}")

    def play_shoot(self, weapon_id):
        self.play_sound(f"shoot_{weapon_id}")

    def play_reload(self):
        self.play_sound("reload")

    def play_hitmarker(self, is_headshot=False):
        self.play_sound("headshot_ding" if is_headshot else "hitmarker_tick")

    def play_jump(self):
        self.play_sound("jump_whoosh")

    def play_explosion(self):
        self.play_sound("explosion_boom")
