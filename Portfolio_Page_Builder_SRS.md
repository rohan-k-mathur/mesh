# Software Requirement Specification: Portfolio Post Type Site Builder

## 1. Introduction
### 1.1 Purpose
This document describes the requirements for a **Portfolio Post Type Site Builder** feature in the Mesh platform. The goal is to allow users to create customizable portfolio websites directly from the standard feed. Unlike the existing Portfolio Node, this feature operates outside of React Flow and focuses on a dedicated page builder.

### 1.2 Scope
When a user chooses the **Portfolio** post type from the feed post dropdown, a modal presents a **Go to Site Builder** button. Clicking this button routes to a full-page builder where the user can design a static portfolio site with drag-and-drop tools. Templates and styling options are provided via sidebars. The completed site is stored as static HTML/CSS under a unique URL and can be shared or embedded.

### 1.3 References
- `Portfolio_Node_SRS.md`
- `Creating_New_Post_Type_Guide.md`
- `Mesh_Roadmap.md`

## 2. Overall Description
The Portfolio Post Type Site Builder is a simplified website creator similar to Cargo or Squarespace. Users can arrange text and media blocks on a canvas, customize styles, and publish the result as a static page served from `/portfolio/{slug}`. The builder uses existing Mesh infrastructure (Next.js API routes, Prisma models, Supabase storage) and standard React components. Drag‑and‑drop libraries such as **dnd-kit** or **react-beautiful-dnd** will speed up development. Rich text editing can leverage **Tiptap** or **Slate**.

## 3. System Features
### 3.1 Post Type Selection
- **Description:** "Portfolio" appears in the feed post type dropdown.
- **UI:** Selecting it opens a modal with a single **Go to Site Builder** button.
- **Requirement:** Clicking the button navigates to `/portfolio/builder`.

### 3.2 Site Builder Page
- **Workspace:** Main canvas area where elements are placed.
- **Sidebars:**
  - **Toolbar Sidebar** with drag-and-drop tools: Box, Text, Image, Link, etc.
  - **Style Sidebar** with color schemes, fonts, spacing, and template presets.
- **Drag & Drop:** Users drag tools onto the canvas to create sections. Elements can be repositioned and resized.
- **Media Uploads:** Integrate existing media upload flow (to Supabase) for images.
- **Undo/Redo & Delete:** Basic editing controls for layout changes.

### 3.3 Templates
- Offer a few starter layouts (grid, column, single page scroll).
- Selecting a template pre-populates the canvas with default boxes.
- Users can modify or remove template elements after loading.

### 3.4 Publishing
- **Save & Preview:** Users can preview the site within the builder.
- **Generate Static Page:** When publishing, the builder serializes the layout into HTML and Tailwind CSS using the templates from `lib/portfolio/export.ts` as a base.
- **Data Storage:** HTML and CSS are saved via `createPortfolioPage` and served from `/portfolio/{slug}`.

### 3.5 Permissions
- Only the creator can edit their portfolio page.
- Pages are public by default, accessible via direct link.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Feed dropdown modal with **Go to Site Builder** button.
- Full-page builder with left/right sidebars and central canvas.
- Image upload dialog using existing components.
- Preview and publish modals.

### 4.2 Software Interfaces
- Next.js 14 frontend with React 18.
- API route `/api/portfolio/export` for saving pages.
- Prisma model `PortfolioPage` (slug, html, css, created_at).
- Supabase for storing uploaded images.

## 5. Functional Requirements
1. **FR1:** The system shall display a **Go to Site Builder** button when the user selects the Portfolio post type.
2. **FR2:** The system shall route to `/portfolio/builder` upon clicking the button.
3. **FR3:** The builder shall allow drag-and-drop placement of text, image, and box elements.
4. **FR4:** Users shall be able to upload images using the existing media storage service.
5. **FR5:** The builder shall provide template presets and style controls.
6. **FR6:** The system shall serialize the canvas to HTML/CSS and store it using `PortfolioPage` model.
7. **FR7:** A published portfolio shall be accessible at `/portfolio/{slug}` with its CSS at `/portfolio/{slug}/tailwind.css`.
8. **FR8:** Only the owner shall be able to access edit mode for their portfolio page.

## 6. Non-Functional Requirements
- **Performance:** Builder interactions should feel responsive (<100 ms drag latency). Page generation should complete in under 2 s.
- **Security:** Ensure only authorized users modify their portfolio pages. Sanitize all user content to prevent XSS.
- **Usability:** Provide intuitive drag-and-drop, clear save/publish actions, and responsive templates for mobile viewports.
- **Maintainability:** Follow project conventions; run `npm run lint` before commits.

## 7. Software Architecture
1. **Frontend**
   - Next.js route `/portfolio/builder` hosts the React page builder.
   - React context stores the current layout state.
   - Drag-and-drop implemented with **dnd-kit** (lightweight and flexible).
   - Text editing via **Tiptap** for inline rich text.
   - Tailwind CSS used for styling; template classes defined under `lib/portfolio`.
2. **Backend**
   - API route `/api/portfolio/export` receives serialized layout (HTML + CSS) and saves via `createPortfolioPage`.
   - Another API route fetches pages via `fetchPortfolioPage` for rendering.
   - Prisma `PortfolioPage` model persists slug, HTML, CSS, timestamp.
3. **Storage**
   - Image uploads go to Supabase storage buckets, returning public URLs inserted in the layout.
4. **Routing**
   - `/portfolio/[slug]` serves saved HTML.
   - `/portfolio/[slug]/tailwind.css` serves associated CSS.
   - Access control middleware ensures only owners see the edit button.

## 8. User Flow Summary
1. User clicks **Create Post** → selects **Portfolio** from dropdown.
2. Modal appears with **Go to Site Builder**.
3. User clicks the button and is routed to `/portfolio/builder`.
4. On the builder page, user drags boxes, texts, and images to compose the site.
5. User customizes style via sidebar options.
6. User previews the site and clicks **Publish**.
7. Backend stores the page and returns the slug.
8. User can share the portfolio link or revisit `/portfolio/builder?slug={slug}` to edit.

## 9. Development Roadmap
1. **Phase 1 – Post Type Integration**
   - Add "PORTFOLIO" enum value to the feed post types.
   - Implement dropdown modal with **Go to Site Builder** button.
   - Create `/portfolio/builder` page skeleton.
2. **Phase 2 – Drag-and-Drop Builder**
   - Integrate dnd-kit for draggable elements.
   - Implement toolbar sidebar with Box, Text, Image tools.
   - Add simple style sidebar for colors and templates.
3. **Phase 3 – Template & Style Engine**
   - Define starter templates in `lib/portfolio/templates`.
   - Allow switching templates and apply style options (colors, fonts).
4. **Phase 4 – Persist & Serve**
   - Connect builder to `/api/portfolio/export` for saving HTML/CSS.
   - Serve pages from `/portfolio/[slug]` and `/portfolio/[slug]/tailwind.css`.
5. **Phase 5 – Polish & Testing**
   - Add preview mode, undo/redo, and keyboard shortcuts.
   - Write unit tests for export generation and page loading.
   - Run `npm run lint` and fix issues.
6. **Phase 6 – Release**
   - Deploy to staging, gather feedback, iterate on templates.
   - Roll out to production once stable.

## 10. Testing Plan
- Unit tests for the export API ensuring HTML/CSS output matches expected snapshots.
- Integration tests for builder interactions (dragging tools, publishing pages).
- Access control tests verifying only owners can edit.
- Continuous linting with `npm run lint` before merging changes.

## 11. Future Enhancements
- Additional templates and advanced style controls (animations, custom fonts).
- Option to download the portfolio as a zip for self‑hosting.
- Integration with third‑party hosting (Netlify, GitHub Pages) similar to the Portfolio Node.
- Collaborative editing for teams.

