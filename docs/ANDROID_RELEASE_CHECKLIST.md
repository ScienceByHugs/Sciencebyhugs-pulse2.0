# Android / Google Play release checklist

## Build and package
- [x] Android package: `com.sciencebyhugs.pulse`
- [x] EAS preview builds produce APKs for device testing
- [x] EAS production builds produce Android App Bundles (AAB)
- [x] Keyboard layout uses `resize` for form-heavy screens
- [x] Dark Android status/navigation bars match Pulse
- [ ] Generate Android adaptive foreground icon with transparent safe-zone artwork
- [ ] Confirm production target SDK / Play policy with the release build

## Device QA
- [ ] Test on a recent Google Pixel
- [ ] Sign up and confirm email deep link opens Pulse
- [ ] Password reset deep link opens Pulse
- [ ] Create/edit/archive protocol
- [ ] Verify Today schedule calculations
- [ ] Quick Log prevents accidental duplicate taps
- [ ] Quick Log decrements inventory once
- [ ] Timeline reflects logged dose
- [ ] Insights refresh after logging
- [ ] Offline Quick Log queues and replays once
- [ ] Notification permission prompt appears
- [ ] Reminder notification fires at expected local time
- [ ] Private notification mode hides sensitive item names
- [ ] Biometric lock works with Android biometric prompt
- [ ] Kill/relaunch preserves session and local settings
- [ ] Small-screen and large-screen layout pass
- [ ] Keyboard never hides focused fields or primary actions

## Play Console
- [ ] Create Pulse app in Google Play Console
- [ ] Complete developer/account verification requirements
- [ ] Add app name, short description, full description
- [ ] Upload phone screenshots and feature graphic
- [ ] Complete Data safety form
- [ ] Complete app access instructions for reviewer
- [ ] Complete content rating questionnaire
- [ ] Add privacy policy URL
- [ ] Complete Health apps declaration / applicable health disclosures
- [ ] Configure internal testing track
- [ ] Upload signed production AAB
- [ ] Add testers and verify install from Play
- [ ] Determine whether account is subject to closed-test production-access requirements
- [ ] Promote release only after Android device QA passes

## Release commands

Device-test APK:

```bash
eas build --platform android --profile preview
```

Play-ready AAB:

```bash
eas build --platform android --profile production
```

After the production AAB is accepted in Play Console, use the Play track workflow chosen for this account (internal, closed, then production as applicable).
