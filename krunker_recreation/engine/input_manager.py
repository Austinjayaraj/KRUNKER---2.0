"""Input manager for tracking keyboard and mouse state."""

class InputManager:
    def __init__(self):
        self.keys = {}
        self.mouse_delta_x = 0.0
        self.mouse_delta_y = 0.0
        self.is_pointer_locked = False
        self.mouse_buttons = {0: False, 1: False, 2: False}

    def set_key(self, key_code, is_pressed):
        self.keys[key_code] = is_pressed

    def is_key_down(self, key_code):
        return self.keys.get(key_code, False)

    def set_mouse_delta(self, dx, dy):
        self.mouse_delta_x = dx
        self.mouse_delta_y = dy

    def consume_mouse_delta(self):
        dx, dy = self.mouse_delta_x, self.mouse_delta_y
        self.mouse_delta_x = 0.0
        self.mouse_delta_y = 0.0
        return dx, dy

    def set_mouse_button(self, button, is_pressed):
        self.mouse_buttons[button] = is_pressed

    def is_mouse_button_down(self, button):
        return self.mouse_buttons.get(button, False)
