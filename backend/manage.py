#!/usr/bin/env python
import os
import sys

from config.env import bootstrap_environment
from dotenv import load_dotenv
load_dotenv()


def main() -> None:
    bootstrap_environment()
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Install dependencies and activate your virtualenv."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
