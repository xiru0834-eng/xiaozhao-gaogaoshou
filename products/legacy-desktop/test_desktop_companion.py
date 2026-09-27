import unittest

import desktop_companion


class DesktopCompanionPageTests(unittest.TestCase):
    def test_skin_sprite_is_preloaded_before_hidden_menu_opens(self):
        html = desktop_companion.page_html('http://127.0.0.1:18766/')

        expected = (
            '<link rel="preload" as="image" fetchpriority="high" '
            'href="http://127.0.0.1:18766/assets/companion-cast.png">'
        )
        self.assertTrue(expected in html)
        self.assertNotIn('__CAST__', html)

    def test_skin_choices_keep_a_visible_card_area(self):
        html = desktop_companion.page_html('http://127.0.0.1:18766')

        for skin in ('mint', 'blue', 'sakura', 'violet', 'amber'):
            with self.subTest(skin=skin):
                self.assertIn(f'data-skin-option="{skin}"', html)
        self.assertTrue('min-height:92px' in html)
        self.assertTrue('border:1px solid var(--line)' in html)


if __name__ == '__main__':
    unittest.main()
