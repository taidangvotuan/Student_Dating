---
name: mobile-secure-storage-biometrics
description: Storing sensitive credentials in iOS Keychain and Android Keystore with Biometric authentication (FaceID / TouchID).
---

# Mobile Secure Storage & Biometrics

## Overview
Protects authentication tokens, cryptographic keys, and user secrets using hardware-backed cryptographic security (Secure Enclave / Keystore).

## Implementation Pattern
```typescript
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export async function getAuthTokenSecurely(): Promise<string | null> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (hasHardware && isEnrolled) {
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock with FaceID to access your account'
    });
    if (!authResult.success) {
      throw new Error('Biometric authentication failed');
    }
  }

  return await SecureStore.getItemAsync('auth_token', {
    requireAuthentication: true,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}
```
