# Manual Acceptance Test Procedure

## Prerequisites

- Dev server running (`pnpm dev`)
- Logged in with a test account that has at least one known user and timeline
- Browser DevTools console open (for migration log verification)

## Recommended Execution Order

1-5 (Keep/Unkeep basics) → 6-7 (Folder/Tag) → 12-14 (Sort/Display rules) → 8 (Drafts) → 15 (Draft edit) → 21 (DraftsPage inline compose) → 9-11 (Scheduled posts) → 16 (Dedup guard) → 17 (Unkeep retry) → 18 (Watch Author) → 19 (Draft LS cleanup) → 20 (Ack independent) → Migration Log

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

### 21. DraftsPage Inline Compose (Draft save)

**Precondition:** At least one timeline is writable.

1. Navigate to `DraftsPage`.
2. Verify an inline `CCPostEditor` exists near the top (same visible controls as home: destination picker, post button, shortcuts).
3. Enter draft text and trigger post/save.
4. Confirm a new/updated draft item appears in `DraftsPage` list.
5. Verify the inline composer input is cleared after save.
6. Verify the corresponding `draftKey` metadata and localStorage are updated (not removed) for the saved draft.

**Expected:** DraftsPage allows drafting in-place without opening a modal; saved content is persisted as a draft entry and can be managed from the list.

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

---

## Execution Log

Record results here per test run. Copy the template below.

```
Date: YYYY-MM-DD
Tester:
Build:

| # | Result | Notes |
|---|--------|-------|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
| 9 | | |
| 10 | | |
| 11 | | |
| 12 | | |
| 13 | | |
| 14 | | |
| 15 | | |
| 16 | | |
| 17 | | |
| 18 | | |
| 19 | | |
| 20 | | |
| Migration | | |
```

Result values: `Pass` / `Fail` / `Skip` / `N/A`
If Fail: add reproduction steps and root cause in Notes column.

---

### Run 1 — Code-path Audit

```
Date: 2026-02-15
Tester: claude-code (static code audit — no dev server)
Build: 2381d9be

| # | Result | Notes |
|---|--------|-------|
| 1 | Pass | useKeepToggle user branch (L53-72): user.Ack() → managed.ack=true, findSubIdFor → managed.watchTargets, upsertItem records both. KeepPage UserItemActions renders AckButton+WatchButton. |
| 2 | Pass | removeWithCleanup (L147-212): iterates managed.watchTargets → client.api.unsubscribe each; if managed.ack → client.getUser → user.UnAck(). On full success → removeItem. Non-managed manual subscriptions are not touched (only managed.watchTargets are iterated). |
| 3 | Pass | useKeepToggle timeline branch (L74-87): findSubIdFor(tRef.fqid) → upsertItem with managed.watchTargets → watchManaged subscribes. TimelineItemActions renders WatchButton for the fqid. TimelinePage header shows WatchButton+KeepButton+Settings. |
| 4 | Pass | Unkeep on timeline item calls removeWithCleanup → unsubscribe each managed.watchTargets entry → removeItem on success. Same path as test 2. |
| 5 | Pass | useKeepToggle message branch (L89-117): upsertItem without managed, then enqueueSnackbar with t('messageKept') + Watch Author button action. Button onClick: client.getUser(msgRef.author) → watchManagedFor(msgItemId, homeTimeline, subId) → snackbar t('nowWatchingAuthor'). watchManagedFor records on message item's managed.watchTargets. Unkeep via removeWithCleanup cleans up those watchTargets. |
| 6 | Pass | FolderManager: addFolder (LibraryContext L547-556) creates UUID + name + order. KeepItemDrawer setFolder assigns folderId. KeepPage folderFilter Select filters by folderId. renameFolder updates name in-place. removeFolder (L559-570) filters folder out AND clears folderId on items with matching folderId. |
| 7 | Pass | KeepItemDrawer: tag add via handleAddTag → setTags. TagRuleManager: addTagRule creates {tag, display}. useDisplayRule (L15-46): looks up authorItem via userByCcid Map, checks authorItem.tags against tagRuleByTag Map. For blur: mostRestrictive returns 'blur'. MessageContainer L495-514: blur wraps body in filter:blur(5px), click sets displayRuleOverride=true. |
| 8 | Pass | DraftsPage sortEntries: pinned first, then updatedAt desc. Edit button (L142-155): reads LS_PREFIX+key+':draft', JSON.parse, opens editorModal with {draft: text, draftKey: entry.key}. EditorModal L102-126: passes draftKey to PostProps → CCPostEditor. CCPostEditor L136: useDraftState(props.draftKey) reads/writes to keyed localStorage. registerDraft updates DraftContext metadata. togglePinDraft toggles pinned flag. |
| 9 | Pass | useScheduledPostRunner (L17-78): iterates entries, checks scheduledAt <= now, reads draft from LS, calls client.createMarkdownCrnt, on success removes draft+LS keys+snackbar. 45s interval timer fires runScheduledPosts. |
| 10 | Pass | visibilitychange listener (L84-88): on tab return (!document.hidden) calls runScheduledPosts() immediately. Missed schedules caught because scheduledAt <= now still holds. |
| 11 | Pass | On catch (L58-73): nextRetry = retryCount+1. If >= MAX_RETRIES(3): scheduledAt=undefined + retryCount + lastError → draft stays in list with failed chip. DraftsPage L121-137: shows retry N/3 chip when retryCount>0 && scheduledAt; shows ErrorOutline 'failed' chip when lastError && !scheduledAt. |
| 12 | Pass | KeepPage sortItems (L56-66): pinned first (b.pinned ? 1 : -1), then marked, then updatedAt desc. Matches spec: pinned > marked > updatedAt. |
| 13 | Pass | MessageContainer L331-375: displayRule === 'omit' && !displayRuleOverride → renders OneLineMessageView-style: CCAvatarWithResolver + t('omittedByDisplayRule') truncated + t('show'). Full row has cursor:pointer + onClick → setDisplayRuleOverride(true). |
| 14 | Pass | MessageContainer L327-329: displayRule === 'hide' && !displayRuleOverride → return null. No placeholder, no UI trace. |
| 15 | Pass | DraftsPage Edit button (same as test 8 detail): reads localStorage for draft text, opens EditorModal with draftKey. CCPostEditor mounts with useDraftState(draftKey) which usePersistent reads keyed LS. setDraft writes back to same key. On modal close, DraftsPage DraftPreview re-reads via usePersistent reactivity. |
| 16 | Pass | useScheduledPostRunner L22: `if (inFlightRef.current.has(entry.id)) continue` — skips entries already in flight. L47: adds to Set before API call. L75-77: .finally removes from Set. Multiple visibilitychange events hitting the same entry.id are no-ops because the Set guard blocks re-entry. |
| 17 | Pass | removeWithCleanup partial failure path (L190-204): when unsubscribe throws, failedOps is non-empty. Remaining targets = original minus succeeded. updateItem sets cleanupFailed:true + remaining watchTargets. Item is NOT removed. KeepPage L241-243: shows ErrorOutline 'cleanupFailed' chip. L278-295: cleanupFailed → Retry button (instead of normal ButtonGroup) calls removeWithCleanup again. Since item still exists with remaining targets, retry re-attempts those. On success → removeItem. |
| 18 | Pass | useKeepToggle message branch (L89-117): enqueueSnackbar with action button. Button calls watchManagedFor(msgItemId, authorUser.homeTimeline, subId) which: subscribes API, then updates the message item's managed.watchTargets via updateItem. Unkeep's removeWithCleanup reads those targets and unsubscribes. All snackbar text uses t() i18n keys. |
| 19 | Pass | DraftContext removeDraft (L75-92): finds entry by id, constructs prefix from LS_PREFIX+entry.key, calls localStorage.removeItem for draft/draftEmojis/draftMedias, then filters entry out of metadata. All 3 LS keys cleaned before metadata removal. |
| 20 | Pass | useKeepToggle user branch (L53-72): Ack fires first unconditionally (`if (user) { await user.Ack(); managed.ack = true }`). Watch is separate: `const subId = user ? findSubIdFor(user.homeTimeline) : undefined; if (user && subId) { managed.watchTargets = [...] }`. When subId is undefined (no matching subscription list), ack is still recorded but watchTargets is absent. upsertItem stores {ack: true} without watchTargets. |
| Migration | Pass | normalizeLibraryItem L232-244: checks rawManaged.watchSubs array. For timeline items with fqid: maps oldSubs to WatchTarget[{fqid, subId}], logs '[Library] Migrated watchSubs → watchTargets'. For non-timeline: logs warning, drops. Migration is idempotent: runs on every normalizeLibraryItem call, but once migrated, watchTargets exists so the `!managed?.watchTargets?.length` guard skips. Hard gate audit confirmed 0 writes to watchSubs anywhere in codebase. |
```

**Summary:** 20/20 Pass + Migration Pass. All code paths verified via static analysis.
Recommendation: confirm with live browser run for visual regressions (blur rendering, snackbar timing, modal focus).
