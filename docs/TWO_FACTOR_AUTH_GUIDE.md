# Two-Factor Authentication (2FA) Implementation

## Overview

This document describes the implementation of Two-Factor Authentication (2FA) using Firebase Authentication's multi-factor authentication feature for admin users in NataCarePM.

## Features Implemented

### ✅ Core 2FA Functionality

1. **Phone Number-Based 2FA**
   - SMS verification codes via Firebase Phone Auth
   - reCAPTCHA integration for bot protection
   - Support for international phone numbers

2. **Admin-Specific 2FA**
   - Only admin and super-admin users can enable 2FA
   - Required for enhanced account security
   - Optional enrollment (can be enforced via admin policy)

3. **2FA Enrollment Flow**
   - User enters phone number
   - Receives 6-digit SMS code
   - Verifies code to complete enrollment
   - Displays backup codes for recovery

4. **2FA Sign-In Flow**
   - User logs in with email/password
   - System detects 2FA is enabled
   - User selects enrolled phone number
   - Receives SMS code
   - Verifies code to complete sign-in

5. **2FA Management**
   - Enable/disable 2FA from admin settings
   - View enrolled phone numbers
   - Manage backup codes
   - View 2FA status

## Architecture

### Components

```
src/components/
  ├── TwoFactorAuth.tsx           # 2FA enrollment component
  ├── TwoFactorSignIn.tsx         # 2FA verification during login
  └── TwoFactorManagement.tsx     # (in TwoFactorAuth.tsx) Settings management
```

### Views

```
src/views/
  ├── AdminSettingsView.tsx       # Admin settings with 2FA section
  └── EnterpriseLoginView.tsx     # Updated login with 2FA support
```

### Context Updates

```
src/contexts/
  └── AuthContext.tsx             # Updated with MFA support
```

## How It Works

### 1. Enrollment Process

```typescript
// TwoFactorAuth.tsx - Enrollment Flow

1. Admin clicks "Enable 2FA" in settings
2. Component initializes reCAPTCHA verifier
3. User enters phone number (+62812345678)
4. Firebase sends SMS verification code
5. User enters 6-digit code
6. Firebase enrolls phone number for MFA
7. System displays backup codes
8. 2FA is now active for this account
```

### 2. Sign-In Process

```typescript
// EnterpriseLoginView.tsx - Login Flow

1. User enters email/password
2. Firebase detects MFA is enabled (auth/multi-factor-auth-required)
3. System shows TwoFactorSignIn component
4. User selects enrolled phone number
5. Firebase sends SMS code
6. User enters verification code
7. Firebase resolves sign-in with MFA assertion
8. User is authenticated
```

### 3. State Management

```typescript
// AuthContext.tsx - MFA State

interface AuthContextType {
  requires2FA: boolean;             // Is MFA required for login?
  mfaResolver: MultiFactorResolver; // Firebase MFA resolver
  cancel2FA: () => void;            // Cancel MFA flow
}

// State flow:
login() → detects MFA → sets requires2FA=true → shows 2FA UI
verify() → completes MFA → sets requires2FA=false → user authenticated
```

## Usage

### For Administrators

#### Enable 2FA

1. Navigate to **Admin Settings** → **Security**
2. Click **Enable 2FA** in the Two-Factor Authentication section
3. Enter your phone number with country code (e.g., +62812345678)
4. Click **Send Verification Code**
5. Check your phone for the 6-digit SMS code
6. Enter the code and click **Verify & Enable 2FA**
7. Save the backup codes displayed

#### Disable 2FA

1. Navigate to **Admin Settings** → **Security**
2. Click **Disable 2FA**
3. Confirm the action

#### Sign In with 2FA

1. Enter your email and password on the login page
2. Click **Sign In**
3. When prompted, click on your enrolled phone number
4. Check your phone for the 6-digit SMS code
5. Enter the code and click **Verify**
6. You will be signed in

### For Developers

#### Add 2FA to a Component

```typescript
import { TwoFactorManagement } from '@/components/TwoFactorAuth';
import { useAuth } from '@/contexts/AuthContext';

function MySettings() {
  const { currentUser } = useAuth();
  
  return (
    <div>
      <TwoFactorManagement user={currentUser} />
    </div>
  );
}
```

#### Check if User Has 2FA Enabled

```typescript
import { getAuth, multiFactor } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const enrolledFactors = multiFactor(user).enrolledFactors;
  const has2FA = enrolledFactors.length > 0;
  
  console.log(`User has 2FA: ${has2FA}`);
}
```

#### Handle 2FA During Login

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { login, requires2FA, mfaResolver } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      
      if (requires2FA) {
        // Show 2FA verification UI
        // Use mfaResolver to complete sign-in
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

## Security Considerations

### ✅ Implemented

1. **reCAPTCHA Protection**
   - Prevents automated attacks during SMS sending
   - Required for all phone verification flows

2. **SMS Rate Limiting**
   - Firebase enforces SMS sending limits
   - Prevents SMS spam/abuse

3. **Secure Session Management**
   - MFA session expires if not completed
   - User must re-authenticate if they cancel

4. **Backup Codes**
   - Generated during enrollment
   - Can be used if phone is unavailable

### ⚠️ Considerations

1. **Phone Number Security**
   - Users should keep phone numbers private
   - SIM swapping is a potential attack vector
   - Consider adding additional security measures

2. **SMS Delivery**
   - SMS may be delayed or not delivered
   - Backup codes are essential for recovery

3. **International Support**
   - Not all countries support SMS verification
   - Consider adding alternative 2FA methods (TOTP)

## Testing

### Test 2FA Enrollment

1. Use a test phone number (see Firebase docs for test numbers)
2. Firebase Console → Authentication → Sign-in method → Phone
3. Add test phone number and verification code
4. Use in development/testing

### Test 2FA Sign-In

1. Create test user account
2. Enable 2FA with test phone number
3. Sign out
4. Sign in with email/password
5. Verify 2FA prompt appears
6. Enter test verification code
7. Confirm successful sign-in

## Firebase Configuration

### Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Phone** provider
5. Configure SMS quota and billing

### Configure Multi-Factor Authentication

1. Go to **Authentication** → **Settings** → **Multi-factor authentication**
2. Enable **SMS** as second factor
3. Configure enrollment policies:
   - Optional (default) - Users can choose to enable
   - Required - All users must enroll
   - Required for admins - Only admin role required

### Add reCAPTCHA Site Key

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create new site (v3 recommended, v2 invisible also works)
3. Add your domains (localhost for development)
4. Copy site key to your Firebase app configuration
5. The component uses Firebase's built-in reCAPTCHA

## Cost Estimation

### Firebase Phone Authentication Pricing

- **Free Tier**: 10,000 verifications/month
- **Paid Tier**: $0.01 per verification after free tier

### Example Costs

- 100 admin users enrolling 2FA: ~$1/month
- 100 admin users logging in daily (30 days): ~$30/month
- Total estimated cost for 100 admins: **~$31/month**

### Cost Optimization

1. Cache user sessions to reduce re-authentication
2. Use longer session durations for trusted devices
3. Implement "Remember this device" feature
4. Consider TOTP (Google Authenticator) as free alternative

## Future Enhancements

### Planned Features

1. **TOTP Support (Google Authenticator)**
   - Alternative to SMS for better security
   - No per-verification costs
   - Works offline

2. **Backup Codes Management**
   - Generate new codes
   - View remaining codes
   - Invalidate used codes

3. **Device Trust**
   - "Remember this device for 30 days"
   - Reduce 2FA prompts on trusted devices
   - Device fingerprinting

4. **WebAuthn/FIDO2**
   - Hardware security keys (YubiKey)
   - Biometric authentication
   - Strongest security option

5. **Admin-Enforced 2FA**
   - Require all admins to enable 2FA
   - Set grace period for enrollment
   - Automated reminders

6. **Audit Logs**
   - Track 2FA enrollment/removal
   - Log successful/failed 2FA attempts
   - Alert on suspicious activity

## Troubleshooting

### Common Issues

#### "reCAPTCHA failed to load"
- **Solution**: Check Firebase Console → Authentication → Phone is enabled
- Verify your domain is whitelisted in Firebase settings

#### "SMS not received"
- **Solution**: Check phone number format includes country code (+62...)
- Verify SMS quota in Firebase Console
- Check billing is enabled for production

#### "Invalid verification code"
- **Solution**: Code expires after 5 minutes - request new code
- Ensure correct 6-digit code without spaces
- Check for SMS delivery delays

#### "User not enrolled"
- **Solution**: Complete 2FA enrollment first in Admin Settings
- Verify enrollment was successful (check Firebase Console)

#### "Multi-factor auth required but no resolver"
- **Solution**: Clear browser cache and cookies
- Ensure AuthContext is properly initialized
- Check Firebase SDK version compatibility

## Security Best Practices

### For Users

1. ✅ Use a phone number you control exclusively
2. ✅ Save backup codes in a secure location
3. ✅ Enable 2FA on all admin accounts
4. ✅ Report lost/stolen phones immediately
5. ✅ Never share verification codes

### For Developers

1. ✅ Always validate phone number format
2. ✅ Implement rate limiting on verification requests
3. ✅ Log all 2FA enrollment/removal events
4. ✅ Monitor for suspicious activity patterns
5. ✅ Keep Firebase SDK updated
6. ✅ Use environment variables for sensitive configs
7. ✅ Implement proper error handling
8. ✅ Test 2FA flow thoroughly before production

## References

- [Firebase Multi-Factor Authentication Docs](https://firebase.google.com/docs/auth/web/multi-factor)
- [Firebase Phone Authentication Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

## Support

For issues or questions:
- Check Firebase Console logs
- Review component error states
- Contact development team
- Check Firebase status page

---

**Last Updated**: Phase 2 Implementation (Task #4 Complete)
**Status**: ✅ Production Ready
**Next**: API Key Management & Firebase App Check (Task #5)
