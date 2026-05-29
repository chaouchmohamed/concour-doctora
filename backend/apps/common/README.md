# Common Module

Shared utilities and base models used across all domain apps.

## Core Models

- **TimeStampedModel** (abstract): Provides `created_at` and `updated_at` fields via `AutoCreatedField`/`AutoLastModifiedField`. Used as the base for all domain models.

## Views

- **HealthCheckView** (`GET /api/health/`): Returns `{"status": "ok"}`. Public, no auth required.

## Permissions

- **PlaceholderPermission**: Skeleton, not used in production.

## Current Status

Utility-only module. No domain logic. No tests needed beyond the health check.
