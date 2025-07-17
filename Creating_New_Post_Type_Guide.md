Creating New Post Type Flow:

1. Creating new card component in components/cards/
2. Import new card component in components/cards/PostCard.tsx
3. Add new post type to enum realtime_post_type in lib/models/schema.prisma
4. Add relevant columns to “model ReatimePost” in lib/models/schema.prisma if necessary 
5. Create Supabase migration file with the structure: 
ALTER TYPE "realtime_post_type" ADD VALUE IF NOT EXISTS ‘(NEW ‘POST TYPE);
ALTER TABLE "realtime_posts" ADD COLUMN IF NOT EXISTS “(RELEVANT COLUMN IF NEEDED)“ (type);
6. Add new post type in app/root/standard/page.tsx inside the RealtimeFeed component in the postTypes parameter — here is an example:  <RealtimeFeed
          initialPosts={result.posts}
          initialIsNext={result.isNext}
          roomId="global"
          postTypes={[
            "TEXT",
	………….
            "PRODUCT_REVIEW",
            "ROOM_CANVAS”,
	“ (ADD NEW POST TYPE HERE),
          ]}
          currentUserId={user.userId}
        />
7. Also add to reactflow: “Adding new node types
Nodes are defined in components/nodes and typed in lib/reactflow/types.ts. To add a node type, create a new React component, extend the types, and register it in the React Flow store.

Plug-ins
Drop plug-ins into the plugins/ folder. Each plug-in exports a descriptor with a type, the React component, and optional config. Restart the dev server with npm run dev and the new nodes become available.”

8. Updated post creation/ actions in lib/actions/realtimepost.actions.ts to persist data in the database— update CreateRealtimePostParams, UpdateRealtimePostParams, createRealtimePost, updateRealtimePost (with updateData inside it)

9. Create a create post modal for the new post type in components/modals/ — this will import the input form at components/forms/ for the user to enter in the relevant data/information for the post type 

10. Create a validation for the new post type in lib/validations/thread.ts as export const NewPostTypeValidation = z.object({……. *insert*…});

11. Import the modal into the Create Feed Post dropdown menu in components/forms/CreateFeedPost.tsx then add it as a case in “const nodeOptions”

12. Double check if everything is in its right place and the logic is sound and styling is clean, robust and matches the standards and conventions of the implementation of the other post types.
