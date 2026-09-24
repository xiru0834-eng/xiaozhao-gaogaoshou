import unittest
from unittest.mock import patch
from companion_schedule import ScheduleClient

class ScheduleClientTests(unittest.TestCase):
    def test_summary_uses_server_events_without_status_writes(self):
        client = ScheduleClient()
        fixtures = [b'<meta name="profile-id" content="9178f39b-3c50-4516-83fa-5321addb8e1e"><meta name="app-token" content="' + b'a'*64 + b'">',
                    b'{"items":[{"company":"Example","date":"2099-01-01","time":"14:00","zone":"Asia/Shanghai","start":"2099-01-01T06:00:00Z","status":"planned","kind":"interview"}]}']
        with patch.object(client, '_read', side_effect=fixtures) as read:
            value = client.summary()
        self.assertTrue(value['available'])
        self.assertIn('Example', value['label'])
        self.assertEqual(read.call_count, 2)

    def test_unavailable_never_claims_no_events(self):
        with patch.object(ScheduleClient, '_read', side_effect=OSError('offline')):
            self.assertFalse(ScheduleClient().summary()['available'])

    def test_invalid_response_is_unavailable(self):
        with patch.object(ScheduleClient, '_read', return_value=b'not our application'):
            self.assertFalse(ScheduleClient().summary()['available'])
