# Dichotomic Tree Wizard - Test & Integration

This directory contains the test page and integration setup for the Dichotomic Tree Wizard (Phase 2, Week 5).

## Components Created

### Core Library
- **`lib/schemes/dichotomic-tree.ts`** - Filtering logic, purpose/source definitions

### React Components
- **`components/schemes/DichotomicTreeWizard.tsx`** - Main wizard component
- **`components/schemes/WizardProgress.tsx`** - Step progress indicator
- **`components/schemes/PurposeStep.tsx`** - Purpose selection step
- **`components/schemes/SourceStep.tsx`** - Evidence source selection step
- **`components/schemes/ResultsStep.tsx`** - Filtered results display

### API
- **`app/api/schemes/all/route.ts`** - GET endpoint for all schemes

### Test Page
- **`app/test/wizard/page.tsx`** - Interactive test page

## Setup & Testing

### 1. Seed Purpose/Source Data

All argument schemes need `purpose` and `source` fields populated:

```bash
npx tsx scripts/seed-dichotomic-tree-metadata.ts
```

This script classifies schemes as:
- **Purpose**: `action` (action-guiding) or `state_of_affairs` (descriptive)
- **Source**: `internal` (reasoning/logic) or `external` (authority/evidence)

### 2. Start Development Server

```bash
npm run dev
```

### 3. View Test Page

Navigate to: **http://localhost:3000/test/wizard**

## Usage

The wizard follows a 3-step flow:

1. **Purpose Selection** - Choose between:
   - 🎯 Justify an Action - Arguments that recommend or criticize actions
   - 📊 Describe a State of Affairs - Arguments that explain or classify

2. **Source Selection** - Choose between:
   - 🧠 Internal Evidence - Logic, definitions, analogies, consequences
   - 📚 External Evidence - Experts, witnesses, tradition, empirical data

3. **Results** - View filtered schemes with match quality indicators

## API Endpoints

### GET /api/schemes/all

Returns all argument schemes with transformed fields:

```json
[
  {
    "id": "...",
    "key": "argument_from_expert_opinion",
    "name": "Argument from Expert Opinion",
    "summary": "...",
    "purpose": "action",
    "source": "external",
    "cqs": [...],
    "criticalQuestions": [...]
  }
]
```

## Integration Checklist

- [x] Core filtering logic implemented
- [x] Wizard UI components created
- [x] API endpoint functional
- [x] Test page deployed
- [x] Database seeded with purpose/source data
- [ ] User testing framework (deferred)
- [ ] Integration with main app navigation

## Next Steps

1. Test the wizard at `/test/wizard`
2. Verify filtering works for all purpose/source combinations
3. Integrate into main application navigation
4. Move on to Week 6: Cluster Browser

## Troubleshooting

**No schemes appear in results:**
- Run the seed script: `npx tsx scripts/seed-dichotomic-tree-metadata.ts`
- Check that schemes have `purpose` and `source` fields in database

**API returns empty array:**
- Ensure database has ArgumentScheme records
- Check Prisma client is generated: `npx prisma generate`

**Components not found:**
- Ensure all component files exist in `components/schemes/`
- Check imports use correct paths with `@/` alias
