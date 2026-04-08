from django.test import TestCase

from .models import RoleChoices


class RolesTestCase(TestCase):
    def test_role_choices_count(self):
        self.assertEqual(len(RoleChoices.choices), 8)
