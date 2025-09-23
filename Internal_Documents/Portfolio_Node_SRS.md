# Software Requirement Specification: Portfolio Node

## 1. Introduction
### 1.1 Purpose
This document outlines the requirements for a **Portfolio Node** that allows users to export selected content from Mesh rooms into standalone websites. The goal is to help artists and creators showcase work produced on the platform in a portable format.

### 1.2 Scope
The Portfolio Node operates inside Mesh rooms like other nodes but also offers an export workflow to generate static HTML, CSS, and assets. It integrates with React Flow, uses existing storage for images and other media, and outputs a download bundle that can be hosted anywhere.

### 1.3 References
- `Mesh_Roadmap.md`
- `Advanced_Node_System_SRS.md`
- Existing node components in `components/nodes`

## 2. Overall Description
A Portfolio Node collects text posts, images, and links from a room. Users choose a template and theme, then export the selection as a static website. The export process compiles React components into HTML with Tailwind CSS and bundles referenced media. The resulting zip file can be downloaded or stored for later hosting.

## 3. System Features
### 3.1 Content Selection
- **Description:** Users pick which nodes from the room to include in the portfolio.
- **UI:** Checklist or drag-and-drop interface to order items.
- **Requirements:** Only items the user owns or has permission to share should be selectable.

### 3.2 Template Customization
- **Description:** Provide layout templates (grid, single-page scroll, gallery, etc.).
- **Customization:** Users can choose color schemes and typography.
- **Preview:** Live preview within the node before exporting.

### 3.3 Static Export
- **Description:** Generate HTML and Tailwind CSS based on the chosen template.
- **Assets:** Download associated images and media from storage.
- **Output:** Offer a zip file download or save to the user’s profile for later retrieval.

### 3.4 Hosting Integration (Optional)
- **Description:** Optional step to deploy directly to popular static hosts (e.g., GitHub Pages, Netlify) via APIs.
- **Requirements:** Store deployment tokens securely and show progress feedback.

### 3.5 React Flow Compatibility
- **Description:** The node behaves like other nodes in rooms and on the feed.
- **State:** Stores configuration (selected items, template choice) in the database.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Node creation modal to select initial template and title.
- Editing modal to change selected items and theme.
- Export dialog with preview and download/deploy buttons.

### 4.2 Hardware Interfaces
- None beyond typical browser requirements.

### 4.3 Software Interfaces
- Supabase storage for media assets.
- Next.js API routes for generating the export bundle.
- Optional deploy integrations (GitHub, Netlify APIs).

### 4.4 Communication Interfaces
- HTTPS requests to fetch media and generate the bundle.
- OAuth or token-based APIs for optional deployment providers.

## 5. Functional Requirements
1. **FR1:** The system shall allow users to choose which room nodes to include in a portfolio.
2. **FR2:** The system shall provide templates and themes for the exported website.
3. **FR3:** The system shall generate static HTML and CSS incorporating the selected content.
4. **FR4:** The system shall bundle images and media assets for download.
5. **FR5:** The system shall optionally deploy the portfolio directly to third-party hosting services.
6. **FR6:** The node’s configuration shall be stored so users can edit and re-export later.

## 6. Non-Functional Requirements
- **Performance:** Export generation should complete within a few seconds for typical rooms.
- **Security:** Only authorized content can be exported or deployed. Deployment tokens must be stored securely.
- **Reliability:** Exports should be repeatable and produce consistent output.
- **Maintainability:** Follow project coding conventions and ensure `npm run lint` passes.
- **Usability:** Provide clear previews and progress indicators during export and deployment.

## 7. System Architecture
The Portfolio Node UI lives in React Flow like other nodes. When exporting, it calls an API route that renders the selected content using server-side templates and Tailwind. The API gathers media URLs from Supabase, downloads the assets, and writes them into a temporary directory. After rendering, the server packages everything into a zip file and returns it to the client. Optional deployment integrations use OAuth tokens stored per user to push the generated site to hosting providers. Configuration for each portfolio (selected items, template, theme) is persisted in the database so users can revisit and regenerate.

## 8. Testing Plan
- Unit tests for the export API and template rendering logic.
- Snapshot tests verifying generated HTML for each template.
- Integration tests covering media download and zip creation.
- Mocked tests for deployment integrations.
- Continuous linting with `npm run lint`.

## 9. Future Considerations
- Add more templates and support custom user templates.
- Offer automated screenshot generation for quick previews.
- Provide analytics on portfolio views when deployed.

## 10. Architecture Roadmap
1. **Define Data Model** – Extend existing node schema to store selected item IDs, template choice, and theme options.
2. **Build Node UI** – Create React components for selection, template preview, and export controls within React Flow.
3. **Implement Export API** – Server route renders HTML with Tailwind, gathers assets, and returns a zip file.
4. **Add Deployment Hooks** – Integrate GitHub Pages or Netlify deployments using stored tokens.
5. **Persist & Edit** – Allow reopening the node to modify selections and regenerate the site.
6. **Testing & Linting** – Write unit/integration tests and ensure `npm run lint` passes before merging.
7. **Iterate on Templates** – Gather feedback and expand template library with more layouts and styles.
