# Software Requirement Specification: Advanced Node System

## 1. Introduction
### 1.1 Purpose
This document outlines the requirements and high-level architecture for a new set of nodes in Mesh. These nodes extend the platform with AI-powered workflows, audio capabilities, and export functionality. The goal is to support complex node chaining, portfolio generation, and plug-in extensibility while remaining compatible with existing room and feed infrastructure.

### 1.2 Scope
The scope covers five main features:
1. **LLM instruction nodes** that chain prompts together (e.g., text-to-image pipelines).
2. **State machine builder** for representing node connections as workflows.
3. **Webpage portfolio nodes** that export content to static HTML/CSS pages.
4. **DAW/Audio nodes** with LiveKit integration for recording and playback.
5. **Generalized plug‑in architecture** for dynamically loading custom node types.

### 1.3 References
- `Mesh_Roadmap.md`
- `README.md`
- Existing node components in `components/nodes`

## 2. Overall Description
The advanced node system expands Mesh's real-time canvas with specialized node types and a plug-in framework. LLM instruction nodes allow chaining prompts so output from one model feeds another. The state machine builder provides a visual way to connect nodes and control execution order. Portfolio nodes transform content from a room into a downloadable website. DAW/Audio nodes enable collaborative sound editing using LiveKit. The plug-in architecture allows developers to package new node types that load at runtime without modifying core code.

## 3. System Features
### 3.1 LLM Instruction Nodes
- **Description:** Nodes that send prompts to large language or diffusion models.
- **Workflow:** Output from one node becomes the prompt for the next, enabling conversions such as text → image → style transfer.
- **UI:** Each node displays its prompt, output preview, and status (pending, running, complete).

### 3.2 State Machine Builder
- **Description:** Graphical editor to define execution order and branching logic between nodes.
- **Capabilities:** Users can create states, transitions, and conditional branches. The builder visualizes active states during execution.

### 3.3 Webpage Portfolio Nodes
- **Description:** Node type that collects text, images, and links then exports them as a static website.
- **Export Format:** Generates HTML and Tailwind CSS so users can host their portfolios anywhere.
- **Customization:** Templates for layout and color schemes.

### 3.4 DAW/Audio Nodes
- **Description:** Audio workstation nodes with timeline editing and effects racks.
- **LiveKit Integration:** Real-time recording and playback among room participants.
- **Storage:** Audio clips saved to Supabase or similar storage for later editing.

### 3.5 Plug‑in Architecture
- **Description:** Framework that discovers and loads external node packages.
- **Registration:** Plug-ins expose metadata and React components which the app registers at startup.
- **Isolation:** Sandboxed execution so third‑party nodes cannot affect core logic.

## 4. External Interface Requirements
### 4.1 User Interfaces
- Node creation modals for LLM instructions, portfolios, and audio projects.
- State machine builder canvas integrated with React Flow.
- Export dialogs for portfolio downloads and audio mixes.

### 4.2 Hardware Interfaces
- Standard browsers with Web Audio API support.
- Microphone and output devices for recording and playback.

### 4.3 Software Interfaces
- OpenAI or similar API for LLM and diffusion models.
- LiveKit client for audio streams.
- Plug‑in loader for dynamic `import()` of node packages.

### 4.4 Communication Interfaces
- HTTPS calls to model APIs and file storage endpoints.
- WebRTC via LiveKit for audio.

## 5. Functional Requirements
1. **FR1:** The system shall allow users to chain multiple LLM instruction nodes so the output of one feeds into the next.
2. **FR2:** The state machine builder shall let users define states, transitions, and conditions connecting nodes.
3. **FR3:** Portfolio nodes shall export selected room content as static HTML and CSS that the user can download.
4. **FR4:** DAW/Audio nodes shall record and play back audio in real time using LiveKit.
5. **FR5:** The plug‑in architecture shall load custom node types at runtime based on discovered packages.
6. **FR6:** Node UI components shall appear in React Flow rooms and the feed like existing node types.

## 6. Non-Functional Requirements
- **Performance:** Node chaining and audio recording should not introduce noticeable lag (>200 ms) in typical sessions.
- **Security:** Plug‑ins must run in isolated contexts with limited permissions.
- **Reliability:** State machine execution should resume gracefully after reconnecting.
- **Maintainability:** Follow project coding conventions and ensure `npm run lint` passes.
- **Usability:** Provide intuitive editors for prompts, state machines, and audio timelines.

## 7. System Architecture
The architecture introduces a plug‑in loader that scans installed packages for node descriptors. Each descriptor registers a React component and configuration schema. LLM instruction nodes leverage existing API utilities to call external models and store intermediate results. The state machine builder stores workflow graphs in the database and executes them client‑side, triggering each node in sequence. Portfolio nodes compile selected canvas items into a static site generator. DAW/Audio nodes use LiveKit to synchronize audio tracks, while storing raw files in Supabase. All nodes communicate via React Flow events and share common context providers.

## 8. Testing Plan
- Unit tests for the plug‑in loader and state machine execution logic.
- Integration tests chaining LLM instruction nodes to verify outputs flow correctly.
- Snapshot tests for portfolio export templates.
- Manual tests for LiveKit audio recording in different browsers.
- Continuous linting with `npm run lint`.

## 9. Future Considerations
- Support local model execution for offline workflows.
- Expand plug‑in marketplace with rating and version management.
- Provide shareable templates for common state machine patterns.
