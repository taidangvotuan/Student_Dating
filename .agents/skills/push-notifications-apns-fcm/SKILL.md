---
name: push-notifications-apns-fcm
description: End-to-end push notifications handling for iOS (APNs) and Android (FCM), token lifecycle, and background payload handlers.
---

# Push Notifications (APNs & FCM)

## Overview
Implements reliable remote push delivery, notification token registration, and background message processing for mobile apps.

## Key Considerations
- **Token Invalidation**: Refresh registration tokens on every app launch and push updates to backend.
- **Silent Background Notifications**: Use `content-available: 1` on iOS for data pre-fetching without alerting the user.
- **Notification Channels (Android)**: Define notification categories (e.g., `Marketing`, `Transactional Alerts`) with distinct importance levels.
