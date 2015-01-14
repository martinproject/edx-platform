"""
Tests for mobile API utilities.
"""

import ddt
from mock import patch
from django.test import TestCase

from xmodule.modulestore.tests.factories import CourseFactory

from .utils import mobile_course_listing_access, mobile_course_access, mobile_view, dict_value
from .testutils import MobileAPITestCase, ROLE_CASES


@ddt.ddt
class TestMobileCourseListingAccess(MobileAPITestCase):
    """
    Tests for mobile_access_when_enrolled utility function.
    """
    @ddt.data(*ROLE_CASES)
    @ddt.unpack
    def test_mobile_role_access(self, role, should_have_access):
        """
        Verifies that our mobile access function properly handles using roles to grant access
        """
        non_mobile_course = CourseFactory.create(mobile_available=False)
        if role:
            role(non_mobile_course.id).add_users(self.user)
        self.assertEqual(should_have_access, mobile_course_listing_access(non_mobile_course, self.user))

    def test_mobile_explicit_access(self):
        """
        Verifies that our mobile access function listens to the mobile_available flag as it should
        """
        self.assertTrue(mobile_course_listing_access(self.course, self.user))

    def test_missing_course(self):
        """
        Verifies that we handle the case where a course doesn't exist
        """
        self.assertFalse(mobile_course_listing_access(None, self.user))

    @patch.dict('django.conf.settings.FEATURES', {'DISABLE_START_DATES': False})
    def test_unreleased_course(self):
        """
        Verifies that we allow the case where a course hasn't started
        """
        self.assertTrue(mobile_course_listing_access(self.course, self.user))


@ddt.ddt
class TestMobileAPIDecorators(TestCase):
    """
    Basic tests for mobile api decorators to ensure they retain the docstrings.
    """
    @ddt.data(mobile_view, mobile_course_access)
    def test_function_decorator(self, decorator):
        @decorator()
        def decorated_func():
            """
            Test docstring of decorated function.
            """
            pass

        self.assertIn("Test docstring of decorated function.", decorated_func.__doc__)
        self.assertEquals(decorated_func.__name__, "decorated_func")
        self.assertTrue(decorated_func.__module__.endswith("tests"))


class TestSettingContextManager(TestCase):
    """
    Tests for setting contextmanager.
    """
    def setUp(self):
        super(TestSettingContextManager, self).setUp()
        self.test_settings = {}
        self.test_key = 'test key'

    def call_context_manager(self):
        """Helper method that calls the context manager."""
        new_value = "new value"
        with dict_value(self.test_settings, self.test_key, new_value):
            self.assertEquals(self.test_settings[self.test_key], new_value)

    def test_no_previous_value(self):
        self.call_context_manager()
        self.assertNotIn(self.test_key, self.test_settings)

    def test_has_previous_value(self):
        old_value = "old value"
        self.test_settings[self.test_key] = old_value

        self.call_context_manager()
        self.assertEquals(self.test_settings[self.test_key], old_value)
