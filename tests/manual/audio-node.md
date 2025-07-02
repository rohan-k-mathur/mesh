# Audio Node Manual Testing

This document outlines manual tests for LiveKit audio recording across browsers as described in the testing plan (see Advanced_Node_System_SRS.md lines 85-90).

## Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)

## Steps
1. Run `yarn dev` to start the development server.
2. In each browser, open `http://localhost:3000/(root)/(realtime)/<roomId>`.
3. Use the **Add Node** menu to insert an **AUDIO** node.
4. Click **Record**, speak into the microphone, then click **Stop**.
5. Verify the recorded clip plays back within the node.
6. Refresh the page and confirm the clip is loaded from Supabase storage.
7. Connect a second browser to the same room and ensure playback is audible in real time via LiveKit.

Document any discrepancies or errors.
