import pathlib
import unittest
from desktop_pet_model import Animation, clamp_position, load_cast


class PetModelTests(unittest.TestCase):
    def test_one_shot_returns_to_idle_and_pause_does_not_advance(self):
        player = Animation({'idle': [100, 100], 'greet': [50, 50]})
        player.start('greet', 0)
        self.assertEqual(player.tick(.060), ('greet', 1))
        self.assertEqual(player.tick(.110), ('idle', 0))
        player.paused = True
        self.assertEqual(player.tick(100), ('idle', 0))
        player.paused = False
        self.assertEqual(player.tick(100.05), ('idle', 0))

    def test_restored_position_is_clamped(self):
        self.assertEqual(clamp_position(-5000, 9000, 200, 240, (0, 0, 1920, 1080)), (0, 840))
        self.assertEqual(clamp_position(-1600, 50, 200, 240, (-1920, 0, 0, 1080)), (-1600, 50))

    def test_five_characters_and_every_referenced_frame_exist(self):
        cast = load_cast(pathlib.Path(__file__).resolve().parents[3] / 'assets/pet')
        self.assertEqual(len(cast), 5)
        self.assertEqual(sum(len(a['frames']) for c in cast for a in c['actions']), 70)

    def test_windows_decodes_every_frame_with_real_transparency(self):
        from desktop_pet_native import Renderer
        root = pathlib.Path(__file__).resolve().parents[3] / 'assets/pet'
        renderer = Renderer()
        try:
            for character in load_cast(root):
                for action in character['actions']:
                    for path in action['frames']:
                        bitmap, raw = renderer.load(root / path, 160, 192)
                        alpha = raw[3::4]
                        self.assertIn(0, alpha, path)
                        self.assertGreater(max(alpha), 240, path)
                        self.assertTrue(all(max(raw[i:i+3]) <= raw[i+3] for i in range(0, len(raw), 4)), path)
                        self.assertTrue(bitmap)
        finally:
            renderer.close()
        self.assertEqual(renderer.bitmaps, [])
