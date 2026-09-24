import pathlib
import tempfile
import unittest
from desktop_runtime import validate_health, read_settings


class DesktopRuntimeTests(unittest.TestCase):
    def test_requires_matching_profile_and_latest_capability(self):
        valid = {'app': 'xiaozhao-gaogaoshou-ts', 'profileId': 'p', 'features': {'recruitmentTasks': 2}}
        validate_health(valid, 'p')
        for data in [dict(valid, app='other'), dict(valid, profileId='q'), dict(valid, features={})]:
            with self.assertRaises(RuntimeError):
                validate_health(data, 'p')

    def test_missing_configuration_does_not_create_blank_user_profile(self):
        with tempfile.TemporaryDirectory() as temp:
            path = pathlib.Path(temp) / 'desktop-settings.json'
            with self.assertRaisesRegex(RuntimeError, '配置'):
                read_settings(path)
            self.assertFalse(path.exists())
