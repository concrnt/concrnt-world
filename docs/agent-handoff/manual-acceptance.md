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

### 5. Message Keep/Unkeep + Watch Author

**Precondition:** A message is visible in a timeline.

1. Open message actions and click **Keep**.
2. Verify a "Message kept" snackbar appears with a **Watch Author** action button.
3. Click **Watch Author** — verify "Now watching author" snackbar appears.
4. Navigate to KeepPage → "Messages" tab.
5. Verify the message appears.
6. Click **Unkeep**.
7. Verify the message is removed from the list.

**Expected:** Keep shows Watch Author snackbar; clicking it subscribes to the author's home timeline.

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

### 8. Draft Multi-management + Pin + Edit

1. Navigate to DraftsPage.
2. Create 3+ drafts with different content.
3. Pin one draft using the pin icon.
4. Verify pinned drafts sort to the top.
5. Click the **Edit** (pencil) button on a draft.
6. Verify the EditorModal opens with the draft content pre-filled and the correct `draftKey`.
7. Edit the text and close the modal — verify changes persist in DraftsPage.
8. Unpin and verify sort order reverts to `updatedAt` descending.

**Expected:** Pin/Edit buttons work; EditorModal opens with draftKey for persistent editing.

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

### 15. Draft Edit from DraftsPage

**Precondition:** At least one draft exists in DraftsPage.

1. Navigate to DraftsPage.
2. Click the **Edit** (pencil) icon on a draft entry.
3. Verify the EditorModal opens with the draft's text content.
4. Modify the text and close/post.
5. Reopen DraftsPage — verify the draft preview reflects the new content.

**Expected:** Edit button opens EditorModal with draftKey; edits persist via localStorage.

---

### 16. Scheduled Post Dedup Guard

**Precondition:** A draft is scheduled for immediate posting.

1. Schedule a draft for a time in the past (or wait for it to fire).
2. Throttle the network (DevTools → Slow 3G).
3. Trigger `visibilitychange` by switching tabs multiple times quickly.
4. Verify only one "Scheduled post sent" snackbar appears (no duplicates).

**Expected:** `inFlightRef` guard prevents duplicate API calls for the same scheduled entry.

---

### 17. Unkeep Retry (Partial Failure)

**Precondition:** A timeline or user item is kept with managed watchTargets.

1. Disconnect network (DevTools → Offline).
2. Click **Unkeep** on the item.
3. Verify the item is **not** removed — it remains in the list with a "cleanupFailed" warning chip.
4. Verify a **Retry** button appears instead of the normal Unkeep ButtonGroup.
5. Reconnect network.
6. Click **Retry**.
7. Verify the item is now removed successfully.

**Expected:** Partial failure preserves the item; Retry re-attempts cleanup and removes on success.

---

### 18. Message Keep Watch Offer (managed on message item)

**Precondition:** A message is visible in a timeline.

1. Open message actions and click **Keep**.
2. Verify a snackbar appears (i18n: "Message kept") with a **Watch Author** button.
3. Click **Watch Author**.
4. Verify a follow-up snackbar (i18n: "Now watching author").
5. Navigate to KeepPage → Messages tab → verify the message item's `managed.watchTargets` contains the author's timeline (check via DevTools → LocalStorage).
6. Click **Unkeep** on the message → verify the managed watch subscription is cleaned up.

**Expected:** Watch Author snackbar fires subscription; watchTargets recorded on message item; Unkeep cleans up the subscription.

---

### 19. Draft Deletion Cleans localStorage

**Precondition:** At least one draft exists in DraftsPage with content.

1. Note the draft's key (check via DevTools → LocalStorage for `arakoshi:<key>:draft`).
2. In DraftsPage, click the delete button on the draft.
3. Check DevTools → LocalStorage.
4. Verify `arakoshi:<key>:draft`, `arakoshi:<key>:draftEmojis`, `arakoshi:<key>:draftMedias` are all removed.

**Expected:** Draft deletion removes both metadata and all associated localStorage keys.

---

### 20. User Keep Ack Independent of Watch

**Precondition:** A user profile page is open.

1. Ensure no subscription lists are available (or the user's homeTimeline has no matching subId).
2. Click **Keep** on the user.
3. Verify the user is kept with `managed.ack: true` even though Watch was not fired.
4. Navigate to KeepPage → verify the user entry has Ack state but no watchTargets.

**Expected:** Ack fires independently of Watch; subId absence does not block Ack.

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
