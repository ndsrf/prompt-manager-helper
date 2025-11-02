# Usage Tracking Documentation

## What Constitutes "Usage" for a Prompt?

This document defines what actions are tracked as "usage" in the PromptEasy analytics system.

---

## ✅ Tracked Usage Events

The following actions are recorded in the `prompt_usage` table and contribute to analytics:

### 1. **Copy Actions**
When a user copies a prompt to their clipboard for use elsewhere.

**Tracked Locations:**
- **Copy from List View** - Context: `copied_from_list`
- **Copy from Grid View** - Context: `copied_from_grid`
- **Copy from Detail View** - Context: `copied_from_detail_view`
- **Copy from Shared Prompt** - Context: `copied_from_shared_view`
- **Copy from Public Gallery** - Context: `copied_from_gallery`

**Rationale:** User explicitly wants to use the prompt content in another application or LLM interface.

**Data Tracked:**
```typescript
{
  promptId: string,
  userId: string,
  context: string,      // Where the copy happened
  usedAt: timestamp
}
```

---

### 2. **Testing with AI**
When a user tests a prompt using the built-in AI testing feature.

**Context:** `tested_with_ai`

**Rationale:** User is actively trying out the prompt with a live LLM to validate it works as intended.

**Data Tracked:**
```typescript
{
  promptId: string,
  userId: string,
  llmUsed: 'chatgpt' | 'claude' | 'gemini',
  context: 'tested_with_ai',
  usedAt: timestamp
}
```

---

### 3. **Copy from Chrome Extension**
When a user copies a prompt to clipboard using the Chrome extension.

**Context:** `copied_from_extension`

**Rationale:** User is copying the prompt from the extension to use it in an LLM interface.

**Data Tracked:**
```typescript
{
  promptId: string,
  userId: string,
  context: 'copied_from_extension',
  usedAt: timestamp
}
```

---

### 4. **Insert from Chrome Extension**
When a user inserts a prompt into an LLM interface using the Chrome extension.

**Context:** `inserted_from_extension`

**Rationale:** User is actively using the prompt by inserting it into a live LLM interface (ChatGPT, Claude, Gemini, etc.).

**Data Tracked:**
```typescript
{
  promptId: string,
  userId: string,
  context: 'inserted_from_extension',
  usedAt: timestamp
}
```

---

## ❌ Not Tracked as Usage

The following actions are **NOT** considered usage and are either not tracked or only logged to `activity_log`:

### 1. **Viewing/Opening a Prompt**
- Opening the editor
- Viewing prompt details
- Browsing the library

**Rationale:** Viewing is not the same as using. A user might browse many prompts without actually using them.

### 2. **Editing a Prompt**
- Modifying content
- Updating metadata
- Saving changes

**Rationale:** Editing is maintenance, not usage.

### 3. **Organizing Prompts**
- Moving to folders
- Adding tags
- Favoriting

**Rationale:** Organization actions don't represent actual prompt usage.

### 4. **Exporting Prompts**
- JSON export
- Markdown export
- CSV export

**Rationale:** Exporting is primarily for backup/portability, not immediate usage.

### 5. **Sharing Prompts**
- Creating share links
- Sharing with users
- Making public

**Rationale:** The sharer isn't using the prompt at that moment, though recipients may use it later (which is tracked).

### 6. **AI Improvement**
- Using the "Improve" feature

**Rationale:** Improving is refinement for future use, not current usage. This is logged to `activity_log` for tracking AI service usage but not as prompt usage.

---

## 📊 Analytics Impact

### Usage Count (`prompt.usageCount`)
Incremented for each tracked usage event:
- +1 for each copy action
- +1 for each test action

### Analytics Dashboard
Usage data powers the following analytics:

1. **Total Usage** - Count of all usage records
2. **Most Used Prompts** - Ranked by usage count
3. **Usage Timeline** - Daily usage chart
4. **Usage by LLM** - Breakdown of which LLMs are used for testing
5. **Success Rate** - When users mark test results as successful/failed

---

## 🔧 Technical Implementation

### Database Schema

**`prompt_usage` table:**
```sql
CREATE TABLE prompt_usage (
  id UUID PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id),
  user_id UUID REFERENCES users(id),
  llm_used VARCHAR(50),      -- LLM type if tested
  success BOOLEAN,           -- User feedback (optional)
  context TEXT,              -- Where/how it was used
  used_at TIMESTAMP
);
```

**`prompts.usageCount` field:**
- Auto-incremented on each usage event
- Used for quick sorting and filtering

### API Endpoints

**Recording Usage:**
```typescript
trpc.analytics.recordUsage.useMutation({
  promptId: string,
  llmUsed?: string,
  success?: boolean,
  context?: string
})
```

**Querying Usage:**
```typescript
// Get usage stats
trpc.analytics.getUsageStats.useQuery({ startDate, endDate })

// Get most used prompts
trpc.analytics.getMostUsedPrompts.useQuery({ limit, startDate, endDate })

// Get usage timeline
trpc.analytics.getUsageTimeline.useQuery({ days })

// Get usage by LLM
trpc.analytics.getUsageByLlm.useQuery({ startDate, endDate })
```

---

## 🎯 Usage Contexts

All tracked contexts for reference:

| Context | Description | Location |
|---------|-------------|----------|
| `copied_from_list` | Copied from list view | `/library` (list view) |
| `copied_from_grid` | Copied from grid view | `/library` (grid view) |
| `copied_from_detail_view` | Copied from detail page | `/library/:id` |
| `copied_from_shared_view` | Copied from shared prompt | `/shared-prompt/:id` |
| `copied_from_gallery` | Copied from public gallery | `/gallery` |
| `tested_with_ai` | Tested using AI feature | Editor test panel |
| `copied_from_extension` | Copied from Chrome extension | Chrome extension popup |
| `inserted_from_extension` | Inserted into LLM interface | Chrome extension popup |

---

## 💡 Future Considerations

Potential usage events that might be added:

1. ~~**Chrome Extension Usage**~~ - ✅ **Implemented** - When prompts are copied or inserted via Chrome extension
2. **API Usage** - When prompts are fetched via API for external use
3. **Template Instantiation** - When a template is used to create a new prompt
4. **Successful Test Runs** - Track only tests marked as "successful" by user

---

## 📈 Best Practices

### For Users:
- **Copy prompts** when you intend to use them elsewhere
- **Test prompts** to validate they work as expected
- **Rate test results** (success/failure) to improve analytics

### For Developers:
- Always track usage with appropriate `context` values
- Handle tracking failures gracefully (silent failures)
- Don't disrupt user experience if tracking fails
- Include LLM information when testing

---

## 🔒 Privacy & Data Retention

- Usage data is personal to each user
- Only aggregated anonymized stats are shared publicly
- Users can export their usage data
- Usage data follows the same retention policies as other user data
- Enterprise tier may have custom retention policies

---

**Last Updated:** 2025-11-01
**Version:** 1.1 - Added Chrome Extension usage tracking
