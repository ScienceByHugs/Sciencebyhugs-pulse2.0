# Pulse 2.0 Native Release Gate

## Baseline
- [x] Pulse 2.0 foundation merged to `main`
- [x] Post-merge CI green
- [x] Dedicated Supabase project
- [x] RLS/security advisor clean
- [x] Lockfile committed
- [x] EAS development / preview / production profiles

## Gate 1 — Development build
- [ ] EAS project linked
- [ ] iOS credentials/signing resolved
- [ ] Development build generated
- [ ] Installed on physical iPhone
- [ ] Runtime Supabase environment variables configured

## Gate 2 — Critical path on device
- [ ] Sign up / email verification
- [ ] Sign in / session persistence
- [ ] Create protocol
- [ ] Add scheduled item
- [ ] Today computes due state correctly
- [ ] Quick Log succeeds once
- [ ] Inventory decrements exactly once
- [ ] Timeline reflects log
- [ ] Offline Quick Log queues and replays once
- [ ] Pause/resume/archive protocol

## Gate 3 — Native behavior
- [ ] Face ID privacy lock
- [ ] Local reminder permission and delivery
- [ ] Private notification preview
- [ ] Widget renders and refreshes
- [ ] Background -> foreground behavior
- [ ] Keyboard/safe-area pass
- [ ] Haptics pass
- [ ] Loading/empty/error states
- [ ] No horizontal overflow or clipped controls

## Gate 4 — Privacy/destructive flows
- [ ] JSON export
- [ ] Account deletion requires confirmation
- [ ] Account deletion removes auth user + cascaded Pulse rows
- [ ] Deleted session cannot continue reading data
- [ ] Supabase security advisor remains clean

## Gate 5 — TestFlight
- [ ] Preview/production-like EAS build
- [ ] Internal TestFlight install
- [ ] Fresh-install test
- [ ] Upgrade test
- [ ] Notification test after reboot
- [ ] Timezone-change test
- [ ] Poor-network/offline test

## Gate 6 — App Store
- [ ] Final icon and launch assets
- [ ] Screenshots
- [ ] Subtitle / description / keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App Privacy disclosures
- [ ] Health/medical wording review
- [ ] App Review notes

## Deferred by upstream dependency
- [ ] Apple Health bridge — restore when the React Native 0.88 stable / HealthKit peer dependency path is clean.

## Release rule
Do not call Pulse 2.0 beta-ready until Gates 1–4 pass on a physical iPhone. Do not submit to the App Store until Gate 5 passes without a critical defect.
