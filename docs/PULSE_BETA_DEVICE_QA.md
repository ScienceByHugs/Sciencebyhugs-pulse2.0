# Pulse 2.0 — iOS / Android beta device QA

**Status:** Manual test plan; a passing GitHub CI job does not replace actual iOS/Android QA. Record platform, OS version, EAS build ID, user/account, and the exact commit tested. Use non-sensitive sample entries and avoid exposing private notification details in screenshots.

## Release-blocking smoke test (each platform)

| ID | Steps | Expected result |
| --- | --- | --- |
| AUTH-01 | Fresh install, sign up or sign in; exit and relaunch | Session and profile persist; no cross-account content |
| PROTO-01 | Create two named protocols, switch between them, rename one and set start/end | Selected protocol displays correct items; Today respects the date window |
| PROTO-02 | Pause/reactivate one protocol; archive and restore the other | Today and previews exclude inactive protocols, history stays intact |
| SUB-01 | Add substance, edit details, pause, archive, restore | Archived item disappears from active tracking; restore returns paused; existing logs intact |
| CAL-01 | Preview 14 days, grant calendar permission, choose writable calendar, sync twice | Only permitted entries; second sync updates without duplicates |
| CAL-02 | Change a schedule; manually sync again; revoke calendar permission; retry | Old entries reconciled; permission failure is safely surfaced |
| CAL-03 | Disconnect with remove-events option | Only Pulse-managed events are removed; unrelated calendar entries preserved |
| SUP-01 | Add two containers to one substance, one below dose quantity, one sufficient | Quick log uses sufficient matching-unit container, decrements once |
| SUP-02 | Correct remaining balance and provide reason | New balance persists; adjustment record includes old/new amount and reason |
| SUP-03 | Set threshold, opt in to low-stock, cross threshold, reopen app | Private alert appears once for transition; no product names or amounts in preview |
| SUP-04 | Restore stock above threshold then cross it again | New transition can alert again; no alert when opt-out is enabled |
| LOG-01 | Turn off internet, log one dose, restart, reconnect | Outbox submits event only once and stock decrements once |
| LOG-02 | Force retry same client event ID and repeat sync | Same dose log ID returned; no second stock reduction |
| INS-01 | Log completed and skipped days, create PRN, pause a substance | Seven-day consistency uses correct denominator and separate skipped result |
| TIME-01 | Date boundaries at 23:59 and 00:01 local time | Due items and reports move to the correct calendar date |
| TIME-02 | Change device timezone and test daylight-saving change dates | Interval and cycle anchoring remains calendar-day based |
| ACC-01 | Set biometric lock, turn private text on/off, relaunch | Lock and privacy settings persist appropriately |
| ACC-02 | Export user data and inspect format; test account deletion only on disposable user | Export includes intended records; deletion is verified server-side |
| NAV-01 | Traverse Today, Library, Timeline, Insights, Tools, Calendar, You | All routes accessible, consistent back navigation and keyboard handling |

## Mandatory edge conditions

- iOS denied/limited Calendar permissions; Android denied permissions and missing writable calendar.
- Zero inventory, multiple containers with differing units, correction during offline replay, concurrent dose logging.
- No network, reconnect with unstable connection, repeated app foreground/resume, account switch on one device.
- Scheduled events near midnight, DST forward/backward shifts, future protocol start and completed protocol end.
- Notification opt-in and opt-out; ensure no names or quantities leak even if private reminder mode is off.
- Validate accessibility labels, larger dynamic text, reduced-motion and screen reader navigation.

## Exit criteria

- CI green at the exact commit used for the device build.
- All critical scenarios completed on physical iOS and Android; record evidence and failures as GitHub issues.
- Supabase migrations verified in target environment, user-scoped RLS tested with a second account.
- No duplicate calendar events, no duplicate dose logs, no duplicate inventory decrement.
- Confirm final branding, icon, content/privacy/terms/support screens before TestFlight and Play closed testing.

## Device test run notes

| Platform / OS | Build ID / commit | Date | Tester | Pass/fail | Blocking issues |
| --- | --- | --- | --- | --- | --- |
| iOS | Pending | Pending | Pending | Not tested | |
| Android | Pending | Pending | Pending | Not tested | |
