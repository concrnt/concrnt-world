# Manual Acceptance Test Procedure

## Prerequisites

- Dev server running (`pnpm dev`)
- Logged in with a test account that has at least one known user and timeline
- Browser DevTools console open (for migration log verification)

---

## Test Cases

### 1. User Keep (Profile)

**Precondition:** Navigate to a user's profile page.

1. Click the **Keep** button on the profile.
2. Verify the user appears in KeepPage under the "Users" tab.
3. Verify `managed.ack` and `managed.watchTargets` are populated (check via DevTools → Application → LocalStorage).
4. Verify the AckButton and WatchButton appear in the user's KeepPage row.

**Expected:** User is kept with managed ack/watch fired automatically.

---

### 2. User Unkeep (managed protection)

**Precondition:** A user is already kept with managed watch targets.

1. In KeepPage, click **Unkeep** on the user.
2. Verify the library item is removed.
3. Verify managed subscriptions (watch) are cleaned up.
4. If the user was also manually watched (non-managed), verify those subscriptions remain.

**Expected:** Unkeep removes managed subscriptions only; manual Watch subscriptions survive.

---

### 3. Timeline Keep (TimelinePage)

**Precondition:** Navigate to a community timeline page.

1. Verify the header shows: WatchButton + KeepButton + Settings/Info icon (left to right).
2. Click the **KeepButton** (bookmark icon).
3. Navigate to KeepPage → "Communities" tab.
4. Verify the timeline appears with a managed WatchButton.

**Expected:** Timeline is kept with managed watch fired.

---

### 4. Timeline Unkeep

**Precondition:** A timeline is already kept.

1. In KeepPage, click **Unkeep** on the timeline.
2. Verify the library item is removed.
3. Verify managed watch subscriptions are cleaned up.

**Expected:** Unkeep triggers managed unsubscribe.

---

### 5. Message Keep/Unkeep

**Precondition:** A message is visible in a timeline.

1. Open message actions and click **Keep**.
2. Navigate to KeepPage → "Messages" tab.
3. Verify the message appears (no Watch/Ack buttons — messages have no watch association).
4. Click **Unkeep**.
5. Verify the message is removed from the list.

**Expected:** Keep/Unkeep works without Watch/Ack side effects.

---

### 6. Folder CRUD + Assignment

1. In KeepPage, open Settings (gear icon).
2. Create a new folder named "Test Folder".
3. Close settings, assign an item to "Test Folder" via the edit drawer.
4. Use the folder filter dropdown to filter by "Test Folder".
5. Verify only the assigned item is visible.
6. Re-open settings, rename the folder, verify the filter label updates.
7. Delete the folder, verify the item's `folderId` is cleared.

**Expected:** Full folder lifecycle works; items are reassigned on folder deletion.

---

### 7. Tag + TagRule Display Control

1. In KeepPage, edit a user item and add a tag (e.g., "nsfw").
2. Open Settings → Tag Rules, create a rule for tag "nsfw" with display = "blur".
3. Navigate to a timeline where messages from that user appear.
4. Verify messages from the tagged user are displayed with `filter: blur(5px)`.
5. Click on the blurred message to reveal it (override).

**Expected:** TagRule blur is applied; click-to-reveal override works.

---

### 8. Draft Multi-management + Pin

1. Navigate to DraftsPage.
2. Create 3+ drafts with different content.
3. Pin one draft using the pin icon (📌).
4. Verify pinned drafts sort to the top.
5. Unpin and verify sort order reverts to `updatedAt` descending.

**Expected:** Pin icon is an `IconButton` (matching KeepPage pattern); sorting is pinned > updatedAt.

---

### 9. Scheduled Post (Normal Send)

1. In DraftsPage, click the schedule icon on a draft.
2. Set the time to 1-2 minutes from now.
3. Keep the tab open.
4. Wait for the scheduled time.
5. Verify the draft is sent and removed from the list (or marked as sent).

**Expected:** Draft is automatically posted at the scheduled time.

---

### 10. Scheduled Post (Tab Return)

1. Schedule a draft for 1-2 minutes from now.
2. Switch to a different browser tab before the scheduled time.
3. Return to the app tab after the scheduled time has passed.
4. Verify the draft is sent immediately upon tab return.

**Expected:** Missed schedule is caught on visibility change and sent immediately.

---

### 11. Scheduled Post (Failure Retry)

1. Schedule a draft (simulate failure by disconnecting network or using DevTools throttling).
2. Verify `retryCount` increments (visible as "retry 1/3" chip).
3. Verify after 3 failures, the schedule is cancelled and the draft shows a "failed" chip.

**Expected:** retryCount increments on failure; stops at 3 with error state.

---

### 12. List Sort Order (pinned > marked > updatedAt)

1. In KeepPage, keep 4+ items of the same kind.
2. Pin one item, mark another, leave the rest.
3. Verify sort order: pinned items first, then marked items, then by `updatedAt` descending.

**Expected:** Sort order matches `pinned > marked > updatedAt`.

---

### 13. Display: omit + tap-to-show

1. In KeepPage, edit a user item and set display to "omit".
2. Navigate to a timeline with messages from that user.
3. Verify omitted messages show a placeholder with a "Show" action.
4. Click "Show" to reveal the message content.
5. Verify the message displays normally after override.

**Expected:** Omit shows placeholder; tap-to-show reveals content with `displayRuleOverride=true`.

---

### 14. Display: hide (absolute)

1. In KeepPage, edit a user item and set display to "hide".
2. Navigate to a timeline with messages from that user.
3. Verify messages from the hidden user are completely absent (no placeholder).

**Expected:** Hidden messages return `null` — no UI trace at all.

---

## Migration Log Verification (Step 5)

1. In DevTools → Application → LocalStorage, find a library entry with old `watchSubs` format.
   (If none exist, manually inject one for testing.)
2. Reload the app.
3. Check the browser console for:
   - `[Library] Migrated watchSubs → watchTargets for timeline: <fqid>` (for timeline items)
   - `[Library] Dropped legacy watchSubs for <kind> item (no fqid)` (for non-timeline items)
4. Verify the migrated item now has `watchTargets` in the correct format.

**Expected:** Migration is idempotent and logged.
