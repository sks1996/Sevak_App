# 🔔 Hybrid Notification System Documentation

## Overview

The Hybrid Notification System combines **WebSocket**, **Firebase Cloud Messaging (FCM)**, and **Apple Push Notifications (APNs)** to ensure reliable notification delivery across all app states and platforms.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Notification Manager               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ WebSocket   │  │     FCM     │  │    APNs     │         │
│  │ Service     │  │   Service   │  │   Service   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Local     │  │    Email    │  │     SMS     │         │
│  │ Notifications│  │   Service   │  │   Service   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. **WebSocketService**
- **Purpose**: Real-time notifications when app is active
- **Features**: 
  - Persistent connection with auto-reconnect
  - Message queuing during disconnection
  - Health monitoring and ping-pong
- **Use Case**: Instant notifications for active users

### 2. **FCMService**
- **Purpose**: Push notifications for Android devices
- **Features**:
  - Batch sending to multiple devices
  - Topic-based subscriptions
  - TTL and priority management
- **Use Case**: Background notifications for Android users

### 3. **APNsService**
- **Purpose**: Push notifications for iOS devices
- **Features**:
  - JWT-based authentication
  - Category and badge management
  - Production/sandbox environment support
- **Use Case**: Background notifications for iOS users

### 4. **HybridNotificationManager**
- **Purpose**: Orchestrates all notification channels
- **Features**:
  - Channel selection based on preferences
  - Fallback mechanism
  - User preference management
  - Health monitoring

## App State Coverage

| App State | WebSocket | FCM | APNs | Local | Coverage |
|-----------|-----------|-----|------|-------|----------|
| **Active** | ✅ Primary | ✅ Fallback | ✅ Fallback | ✅ Backup | 100% |
| **Background** | ❌ Stopped | ✅ Primary | ✅ Primary | ✅ Backup | 100% |
| **Closed** | ❌ Stopped | ✅ Primary | ✅ Primary | ❌ N/A | 100% |

## Configuration

### Environment Variables

```bash
# WebSocket Configuration
EXPO_PUBLIC_WS_URL=ws://localhost:8080/notifications

# Firebase Cloud Messaging
EXPO_PUBLIC_FCM_SERVER_KEY=your_fcm_server_key_here
EXPO_PUBLIC_FCM_PROJECT_ID=your_fcm_project_id_here

# Apple Push Notifications
EXPO_PUBLIC_APNS_KEY_ID=your_apns_key_id_here
EXPO_PUBLIC_APNS_TEAM_ID=your_apns_team_id_here
EXPO_PUBLIC_APNS_BUNDLE_ID=com.yourcompany.sevakapp
EXPO_PUBLIC_APNS_PRODUCTION=false
```

### User Preferences

```typescript
interface UserNotificationPreferences {
  channels: NotificationChannelConfig[];
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  reminderTimings: {
    oneDayBefore: boolean;
    oneHourBefore: boolean;
    fifteenMinutesBefore: boolean;
    startingNow: boolean;
  };
  // ... more preferences
}
```

## Usage Examples

### Sending a Notification

```typescript
const hybridManager = HybridNotificationManager.getInstance();

const notification: HybridNotification = {
  id: 'unique_id',
  userId: 'user_123',
  title: 'Meeting Reminder',
  message: 'Your meeting starts in 15 minutes',
  type: 'meeting_reminder',
  priority: 'high',
  channels: ['websocket', 'fcm', 'apns', 'local'],
  createdAt: new Date(),
  deliveryStatus: 'pending',
};

const results = await hybridManager.sendNotification(notification);
```

### Scheduling a Notification

```typescript
const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

await hybridManager.scheduleNotification(notification, scheduledTime);
```

### Updating User Preferences

```typescript
await hybridManager.updateUserPreferences('user_123', {
  channels: [
    { channel: 'websocket', enabled: true, priority: 1 },
    { channel: 'fcm', enabled: true, priority: 2 },
    { channel: 'apns', enabled: false, priority: 3 },
  ],
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  },
});
```

## Health Monitoring

### Check System Status

```typescript
const health = await hybridManager.healthCheck();
console.log('System Health:', health);
// Output: { websocket: true, fcm: true, apns: false, local: true }
```

### WebSocket Health Check

```typescript
const wsService = WebSocketService.getInstance();
const isHealthy = await wsService.healthCheck();
```

## Error Handling

### Retry Mechanism

- **WebSocket**: Automatic reconnection with exponential backoff
- **FCM**: Built-in retry with exponential backoff
- **APNs**: Manual retry implementation
- **Local**: Always available (no retry needed)

### Fallback Strategy

1. **Primary Channel**: WebSocket (when app is active)
2. **Secondary Channel**: FCM/APNs (when app is background/closed)
3. **Tertiary Channel**: Local notifications (always available)

## Testing

### Test Notification

```typescript
// Send test notification through all channels
await hybridManager.sendNotification(testNotification);

// Check delivery results
const results = await hybridManager.sendNotification(notification);
const successCount = results.filter(r => r.success).length;
```

### Channel Testing

```typescript
// Test individual channels
const fcmResult = await fcmService.sendNotification(notification, fcmToken);
const apnsResult = await apnsService.sendNotification(notification, deviceToken);
const wsResult = wsService.sendNotification(notification);
```

## Performance Considerations

### Memory Management
- Limited notification history (100 notifications max)
- Automatic cleanup of old notifications
- Efficient channel selection algorithm

### Battery Optimization
- WebSocket connection only when app is active
- Background tasks with appropriate intervals
- Smart scheduling based on user preferences

### Network Efficiency
- Batch FCM requests (up to 1000 tokens)
- Compressed WebSocket messages
- Minimal APNs payload size

## Security

### Authentication
- WebSocket: JWT-based authentication
- FCM: Server key authentication
- APNs: JWT with private key

### Data Protection
- Encrypted message transmission
- Secure token storage
- User preference encryption

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check network connectivity
   - Verify WebSocket URL configuration
   - Check authentication credentials

2. **FCM Not Working**
   - Verify server key and project ID
   - Check device token validity
   - Ensure proper Firebase configuration

3. **APNs Not Working**
   - Verify key ID, team ID, and bundle ID
   - Check certificate validity
   - Ensure proper environment (sandbox/production)

### Debug Mode

```typescript
// Enable debug logging
process.env.EXPO_PUBLIC_DEBUG_NOTIFICATIONS = 'true';
process.env.EXPO_PUBLIC_LOG_LEVEL = 'debug';
```

## Future Enhancements

1. **Rich Notifications**: Support for images, actions, and custom layouts
2. **Notification Analytics**: Delivery rates, user engagement metrics
3. **A/B Testing**: Different notification strategies for user segments
4. **Machine Learning**: Smart notification timing based on user behavior
5. **Cross-Platform Sync**: Notification state synchronization across devices

## Support

For issues or questions regarding the Hybrid Notification System:

1. Check the health status in Settings > Notification Status
2. Review the console logs for error messages
3. Test individual channels using the test notification feature
4. Verify environment configuration matches your setup

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatibility**: React Native 0.81+, Expo SDK 50+
