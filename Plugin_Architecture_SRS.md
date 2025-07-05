# Software Requirement Specification: Plug-in Architecture for Custom Node Types

## 1. Introduction
### 1.1 Purpose
This document defines the requirements and development roadmap for a generalized plug-in architecture in Mesh. The goal is to dynamically load new node types at runtime so that developers can extend the canvas without modifying core code. Initial plug-ins will be used internally to build nodes such as a PDF viewer and Spline 3D model viewer. A later developer API will allow third parties to create their own nodes.

### 1.2 Scope
The plug-in system covers discovery, registration, sandboxed execution, and configuration of external node packages. It spans both the frontend React Flow store and backend APIs that serve plug-in metadata.

### 1.3 References
- `README.md`
- `Advanced_Node_System_SRS.md`
- Existing plug-in examples in `plugins/`

## 2. Overall Description
Mesh currently loads node components statically. The new architecture introduces a loader that scans a plug-in directory and registers descriptors exported by each module. A plug-in packages a React component and optional configuration. During startup the application imports these descriptors and exposes the node types in the canvas. Over time a developer API will expose endpoints for uploading plug-ins, verifying signatures, and listing available node types.

## 3. Product Development Roadmap
1. **Internal Plug-in Loader**
   - Implement dynamic `import()` logic for files under `plugins/`.
   - Register descriptors in the React Flow store and display basic nodes.
   - Build sample plug-ins: PDF viewer and Spline 3D model viewer.
2. **Sandboxing & Permissions**
   - Evaluate iframe or Web Worker isolation for untrusted code.
   - Define allowed dependencies and restrict DOM access.
3. **Configuration Schema**
   - Allow each plug-in to specify editable fields (e.g., URL for PDF).
   - Persist plug-in configuration in node data within Supabase.
4. **Developer API**
   - Provide endpoints to upload plug-in bundles and metadata.
   - Validate packages, store them, and expose versioned descriptors.
5. **Marketplace & Documentation**
   - Create a web page listing available plug-ins with install buttons.
   - Publish guidelines and examples so external developers can contribute.

## 4. System Features
### 4.1 Plug-in Discovery
- **Description:** Load descriptors from a predefined directory or API.
- **Requirements:**
  - Support static import during development and remote fetch in production.
  - Expose loaded node types in the creation menu with labels and icons.

### 4.2 Plug-in Runtime
- **Description:** Render third-party React components inside rooms.
- **Requirements:**
  - Provide a wrapper that supplies common context (user data, room ID).
  - Run plug-ins in isolation to prevent side effects.

### 4.3 Configuration & Storage
- **Description:** Persist per-node settings defined by the plug-in.
- **Requirements:**
  - Store configuration in the `Post` model alongside existing node data.
  - Allow editing via standard modals generated from the schema.

### 4.4 Developer API
- **Description:** Upload and manage plug-in packages.
- **Requirements:**
  - Authenticated endpoint to publish a plug-in with metadata (name, version, signature).
  - Endpoint to retrieve available plug-ins for installation.

### 4.5 User Flows
1. **Creator installs a plug-in** from the marketplace, adds a new node in a room, and configures options such as the PDF URL.
2. **Developer uploads a plug-in** via the API, including a descriptor file. After approval, the plug-in becomes visible to all users.

## 5. External Interface Requirements
### 5.1 User Interfaces
- Node creation menu listing plug-in types.
- Configuration modals driven by plug-in schemas.
- Marketplace page for browsing and installing plug-ins.

### 5.2 Hardware Interfaces
- Standard browsers; optional WebGL support for 3D viewers.

### 5.3 Software Interfaces
- React Flow for rendering nodes.
- Supabase for storing configuration and uploaded packages.
- API routes for plug-in management.

### 5.4 Communication Interfaces
- HTTPS calls to fetch plug-in descriptors and upload packages.
- WebSocket channels continue to sync node data in real time.

## 6. Functional Requirements
1. **FR1:** The system shall load plug-in descriptors at startup and register their node types.
2. **FR2:** Users shall add plug-in nodes to rooms through the standard creation menu.
3. **FR3:** Plug-in configuration defined by the descriptor shall be editable and persisted in the database.
4. **FR4:** The developer API shall allow authenticated uploads of plug-in packages with versioning.
5. **FR5:** The system shall isolate plug-in execution to prevent unauthorized access to the global scope.

## 7. Non-Functional Requirements
- **Performance:** Plug-in loading should not noticeably delay page startup (<200 ms after initial load).
- **Security:** Uploaded plug-ins must be validated and executed in a sandbox to protect user data.
- **Reliability:** Failure of one plug-in shall not affect others or the core application.
- **Maintainability:** All code follows project conventions and passes `npm run lint`.

## 8. System Architecture
1. **Plug-in Loader**
   - Uses `require.context` or dynamic `import()` to gather modules from the `plugins/` folder or API responses.
   - Extracts `descriptor` objects conforming to `PluginDescriptor`.
   - Registers descriptors via `useStore.getState().registerPlugins`.
2. **Runtime Wrapper**
   - Wraps each plug-in component to provide context and sandboxing.
   - Handles errors and prevents untrusted DOM manipulation.
3. **Developer API Service**
   - Stores uploaded plug-in bundles in Supabase storage with metadata.
   - Serves descriptor lists for clients to fetch and install.
4. **Data Model Extensions**
   - Extend the `Post` schema to include a `pluginType` and serialized configuration.
   - Track installed plug-in versions per room.

## 9. Testing Plan
- Unit tests for the loader to ensure descriptors are collected correctly.
- Integration tests rendering plug-in nodes within a room.
- API tests for uploading and fetching plug-in packages.
- Continuous linting with `npm run lint`.

## 10. Future Considerations
- Digital signature verification for plug-in integrity.
- Granular permission model for accessing device capabilities.
- Revenue sharing options for marketplace plug-ins.
