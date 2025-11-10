# Scheme Navigator - User Guide

## Overview

The Scheme Navigator is a unified interface for discovering and selecting argumentation schemes through four complementary navigation modes. It provides a seamless experience with persistent preferences, favorites, and recent history.

**Version:** 1.0 (Phase 2 - Week 8 Complete)  
**Location:** `/test/scheme-navigator`  
**Components:** 11 React components, ~2,300 LOC

---

## Navigation Modes

### 1. Wizard Mode (Dichotomic Tree)
**Best for:** Guided discovery through 2-3 questions

**How it works:**
- Answer questions about your argument's purpose and source
- Each question narrows down possibilities
- Typically 2-3 steps to find relevant schemes
- Shows decision tree breadcrumbs
- Can go back to previous steps

**Use when:**
- You're new to argumentation schemes
- You need guided navigation
- You know your argument's general characteristics
- You want quick, focused results

**Features:**
- 6 purpose categories (action/state-based reasoning)
- 6 source categories (internal/external evidence)
- Interactive step progression
- Visual tree structure
- Back navigation

---

### 2. Cluster Browser
**Best for:** Exploring schemes by semantic domain

**How it works:**
- Browse 9 semantic clusters (authority, causality, decision-making, etc.)
- Click a cluster to see all schemes in that domain
- Switch between grid and list views
- Navigate breadcrumbs to return to cluster overview

**Clusters available:**
1. **Authority & Expertise** - Arguments from credentials, position, expert opinion
2. **Causality & Correlation** - Cause-effect, correlation, consequence arguments
3. **Decision Making & Action** - Arguments for/against courses of action
4. **Classification & Definition** - Categorization, definition, verbal classification
5. **Values & Priorities** - Value-based arguments, priorities, waste
6. **Analogy & Comparison** - Analogical reasoning, comparisons, precedent
7. **Evidence & Example** - Witness testimony, examples, established facts
8. **Commitment & Consistency** - Arguments from commitment, inconsistency
9. **Rules & Exceptions** - Rule-based reasoning, exceptions, alternatives

**Use when:**
- You want to explore related schemes
- You know the domain (authority, causality, etc.)
- You're building domain knowledge
- You want to compare similar schemes

**Features:**
- 9 thematic clusters
- Grid/list view toggle
- Scheme count per cluster
- Color-coded cluster cards
- Breadcrumb navigation

---

### 3. Identification Conditions Filter
**Best for:** Finding schemes based on observable patterns

**How it works:**
- Select one or more identification conditions (observable patterns in arguments)
- Results update in real-time with match scores
- Conditions are organized in 5 categories
- Perfect/strong/moderate/weak quality filters
- Sort by relevance or alphabetically

**Condition Categories:**
1. **Structural Patterns** (8 conditions) - Argument structure and form
2. **Evidential Markers** (5 conditions) - Types of evidence present
3. **Logical Relationships** (4 conditions) - How premises relate
4. **Rhetorical Features** (4 conditions) - Persuasive techniques used
5. **Contextual Indicators** (4 conditions) - Situational characteristics

**Match Quality:**
- **Perfect Match:** Scheme matches all selected conditions
- **Strong Match:** Scheme matches most conditions (75%+)
- **Moderate Match:** Scheme matches some conditions (50-75%)
- **Weak Match:** Scheme matches few conditions (<50%)

**Use when:**
- You can identify specific patterns in your argument
- You want precision in scheme selection
- You're analyzing existing arguments
- You need multiple criteria satisfied

**Features:**
- 25 identification conditions
- Real-time filtering with match scores
- Quality level filtering
- Category expansion/collapse
- Sort by relevance or name
- Tutorial overlay for first-time users

---

### 4. Search
**Best for:** Direct lookup by name or keyword

**How it works:**
- Enter search terms (name, description, key, keywords)
- Results appear instantly
- Apply filters to narrow results
- Recent searches saved for quick access
- Search suggestions as you type

**Search fields:**
- Scheme name
- Description text
- Scheme key (e.g., "argument_from_expert_opinion")
- Summary text
- Title

**Filters available:**
- **Purpose:** action vs. state_of_affairs
- **Source:** internal vs. external
- **Cluster:** Any of the 9 semantic clusters

**Use when:**
- You know the scheme name
- You're looking for specific keywords
- You want fastest path to results
- You've searched before (recent searches)

**Features:**
- Real-time search as you type
- Auto-complete suggestions (top 5 matches)
- Advanced filters (purpose, source, cluster)
- Recent searches (last 10)
- Result count and relevance sorting
- Grid layout with scheme cards

---

## User Preferences & Utilities

### Navigation Header
Located at the top of every mode, provides quick access to:

**Buttons:**
1. **Recents** - View last 10 schemes you've selected
2. **Favorites** - Access your starred schemes
3. **Settings** - Configure preferences
4. **Reset** - Clear all navigation state (requires confirmation)

**Help Text:** Each mode shows contextual help describing how to use it.

---

### Recent Schemes Panel
**Access:** Click "Recents" button in header  
**Max items:** 10 most recent  
**Sorted by:** Most recent first

**Features:**
- Automatic tracking (no action needed)
- Click scheme to select and close panel
- Shows scheme name and key
- Persisted across sessions

**Use case:** Quickly return to schemes you've viewed recently.

---

### Favorites Panel
**Access:** Click "Favorites" button (star icon) in header  
**Max items:** Unlimited  
**Sorted by:** Alphabetically

**Features:**
- Click scheme to select
- Click star to remove from favorites
- Shows scheme name and key
- Persisted across sessions

**How to favorite:**
1. Select a scheme (appears in detail panel)
2. Click star icon in scheme detail panel
3. Scheme is added to favorites

**Use case:** Bookmark schemes you use frequently or want to reference later.

---

### Settings Panel
**Access:** Click "Settings" button (gear icon) in header

**Preferences available:**

1. **Default Navigation Mode**
   - Choose which tab opens by default
   - Options: Wizard, Clusters, Conditions, Search

2. **Identification Conditions**
   - Default sort order (by score or alphabetically)
   - Show tutorial on first visit toggle

3. **Cluster Browser**
   - Default view mode (grid or list)

4. **Data Management**
   - View count of favorites and recent schemes
   - Export data (JSON format)
   - Import data (restore from backup)

**About section:** Shows version information

---

### Scheme Detail Panel
**Appears:** When you select any scheme  
**Location:** Fixed bottom-right corner  
**Dismissible:** Click X to close

**Information shown:**
- Scheme name and key
- Full description
- Premises list (P1, P2, etc.)
- Conclusion format
- Purpose and source badges

**Actions available:**
1. **Favorite toggle** (star icon) - Add/remove from favorites
2. **Copy Key** - Copy scheme key to clipboard
3. **View Full Details** - Open full scheme page in new tab

**Suggested Navigation:**
- Shows recommended mode for this scheme
- Click to switch to that mode

**Related Schemes:**
- **Same Cluster** - Other schemes in same semantic cluster (top 3)
- **Similar Purpose/Source** - Schemes with same characteristics (top 3)
- Click any related scheme to switch to it

---

## Workflow Examples

### Example 1: New User Discovery
**Scenario:** I'm new and need to find a scheme for my argument.

**Steps:**
1. Use **Wizard Mode** (default tab)
2. Answer question 1: "What is your argument's purpose?"
3. Answer question 2: "What is your argument's source?"
4. Review filtered results (typically 2-5 schemes)
5. Click a scheme to see details
6. Click star to favorite if useful
7. Click "View Full Details" to see complete information

**Result:** Found relevant scheme in 2-3 clicks.

---

### Example 2: Domain Expert Browsing
**Scenario:** I want to explore all causality-related schemes.

**Steps:**
1. Switch to **Cluster Browser** tab
2. Click "Causality & Correlation" cluster
3. Review all schemes in cluster (grid or list view)
4. Click schemes to compare details
5. Favorite useful schemes
6. Check "Related Schemes" in detail panel for similar options

**Result:** Comprehensive understanding of causality schemes.

---

### Example 3: Pattern-Based Selection
**Scenario:** My argument has expert testimony and appeals to authority.

**Steps:**
1. Switch to **Identification Conditions** tab
2. Expand "Evidential Markers" category
3. Select "Expert testimony present"
4. Expand "Rhetorical Features" category
5. Select "Appeals to authority"
6. Review high-scoring matches (perfect/strong)
7. Adjust quality filter if needed
8. Select best match

**Result:** Precise scheme matching multiple criteria.

---

### Example 4: Quick Lookup
**Scenario:** I remember seeing "expert opinion" in a scheme name.

**Steps:**
1. Switch to **Search** tab
2. Type "expert opinion" in search box
3. Results appear instantly
4. Click matching scheme card
5. Review details and select

**Result:** Direct access in seconds.

---

### Example 5: Returning User
**Scenario:** I used several schemes yesterday and want to review them.

**Steps:**
1. Click **Recents** button in header
2. Panel opens showing last 10 schemes
3. Click any scheme to reopen
4. Review and compare
5. Favorite any you'll use again

**Result:** Easy access to previous work.

---

## Keyboard Shortcuts

### Search Mode
- **Enter** - Execute search
- **Escape** - Clear search (when input focused)

### All Modes
- **Tab** - Navigate between interactive elements
- **Enter/Space** - Activate buttons and cards

---

## State Persistence

**What is saved:**
- Current navigation mode
- Favorite schemes
- Recent schemes (last 10)
- Recent searches (last 10)
- User preferences (sort order, view mode, etc.)

**Storage:** Browser localStorage (per-device)

**Duration:** Permanent until manually cleared

**Reset:** Click "Reset" button in header (requires confirmation)

---

## Performance Features

### Lazy Loading
Each navigation mode loads only when accessed:
- **First access:** Component loads with spinner (1-2 seconds)
- **Subsequent access:** Instant (cached)

**Benefit:** Faster initial page load, smaller bundle size

### Data Caching
Scheme data is cached using SWR:
- **First load:** Fetches from API
- **Subsequent loads:** Uses cached data
- **Auto-refresh:** Updates in background

**Benefit:** Instant results, reduced server load

---

## Tips & Best Practices

### For Beginners
1. Start with **Wizard Mode** for guided experience
2. Use **Favorites** to bookmark useful schemes
3. Check **Related Schemes** to discover similar options
4. Explore **Clusters** to build domain knowledge

### For Advanced Users
1. Use **Identification Conditions** for precise matching
2. Combine **Search** with filters for quick access
3. Review **Recent Schemes** to compare options
4. Export preferences to backup your configuration

### For Researchers
1. Use **Cluster Browser** to systematically explore domains
2. Apply **Identification Conditions** for rigorous analysis
3. Document scheme keys using **Copy Key** feature
4. Track your workflow with **Recents** and **Favorites**

---

## Technical Details

### Components Architecture
```
SchemeNavigator (main container)
├── NavigationHeader (utilities bar)
├── Tabs (mode switcher)
│   ├── DichotomicTreeWizard (lazy loaded)
│   ├── ClusterBrowser (lazy loaded)
│   ├── IdentificationConditionsFilter (lazy loaded)
│   └── SchemeSearch
├── RecentSchemesPanel (floating)
├── FavoritesPanel (floating)
├── SettingsPanel (floating)
└── SchemeDetailPanel (floating)
```

### State Management
- **Library:** Zustand with persistence middleware
- **Store location:** `lib/schemes/navigation-state.ts`
- **Context:** `components/schemes/SchemeNavigationContext.tsx`

### Data Flow
```
API (/api/schemes/all)
  ↓
SWR Cache
  ↓
Component State
  ↓
Filtered Results
  ↓
UI Display
```

---

## Troubleshooting

### Issue: Schemes not loading
**Solution:** Check network connection, refresh page

### Issue: Favorites/recents not persisting
**Solution:** Check browser localStorage is enabled

### Issue: Search not showing results
**Solution:** Clear filters, try broader search terms

### Issue: Slow performance
**Solution:** Clear browser cache, reduce number of favorites

### Issue: State got corrupted
**Solution:** Click "Reset" button in header to clear all state

---

## Version History

### v1.0 (Phase 2 - Week 8)
- **Week 5:** Dichotomic Tree Wizard (874 LOC)
- **Week 6:** Cluster Browser (1,026 LOC)
- **Week 7:** Identification Conditions Filter (2,616 LOC)
- **Week 8:** Unified Navigator with preferences and search (2,288 LOC)

**Total:** 6,804 LOC across 26 components

---

## Support & Feedback

**Test Page:** `/test/scheme-navigator`  
**Repository:** mesh (rohan-k-mathur)  
**Documentation:** This file

For issues or feature requests, please contact the development team.

---

**Last Updated:** November 10, 2025  
**Author:** AI Development Team  
**Status:** Production Ready ✅
