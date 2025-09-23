Profile Customization & Social Discovery Product Development Roadmap

Mesh already stores user‐level media interests in UserAttributes and exposes a customization screen with modals for entering favorites (movies, albums, etc.). The FancyMultiSelect component lets users pick items, which are persisted via upsertUserAttributes in lib/actions/userattributes.actions.ts. Example of interest editing:

<DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]  ">
  <h2>Interests</h2>
  <DialogHeader className="dialog-header text-white tracking-wide     ">
    <b> What are you into?</b>
  </DialogHeader>
  ...
  <FancyMultiSelect
    fetchMultiselectData={fetchInterests}
    initialSelected={convertListToSelectables(
      userAttributes.interests
    )}
    submitEdits={(selectables) =>
      submitEdits("INTERESTS", selectables, userAttributes, path)
    }
  />
</DialogContent>

submitEdits delegates updates to upsertUserAttributes, ensuring interests, albums, movies, tracks, and artists are stored in the database:

export function submitEdits(
  selectableType: "INTERESTS" | "ALBUMS" | "MOVIES" | "TRACKS" | "ARTISTS",
  selectables: OptionType[],
  userAttributes: UserAttributes,
  path: string
) {
  switch (selectableType) {
    case "INTERESTS":
      return upsertUserAttributes({
        userAttributes: {
          ...userAttributes,
          interests: convertSelectablesToList(selectables),
        },
        path,
      });
    ...

upsertUserAttributes performs the actual Prisma upsert:

export async function upsertUserAttributes({
  userAttributes,
  path,
}: UpsertUserAttributes) {
  const user = await getUserFromCookies();
  ...
  await prisma.userAttributes.upsert({
    where: { user_id: user.userId! },
    update: {
      artists: { set: userAttributes.artists },
      albums: { set: userAttributes.albums },
      songs: { set: userAttributes.songs },
      interests: { set: userAttributes.interests },
      movies: { set: userAttributes.movies },
    },
    create: {
      user_id: user.userId!,
      artists: { set: userAttributes.artists },
      albums: { set: userAttributes.albums },
      songs: { set: userAttributes.songs },
      interests: { set: userAttributes.interests },
      movies: { set: userAttributes.movies },
    },
  });
  revalidatePath(path);
}

The roadmap below builds upon these existing pieces and the broader “Social Discovery Engine (Expansion)” section in Mesh_Roadmap.md.

1. Enhance Profile Customization
Expand the UserAttributes model

Add optional fields for location, birthday, hobbies and community memberships.

Modify the Prisma schema and regenerate the client.

Complete modal implementations

Replace “UNDER CONSTRUCTION” placeholders in customize-components.tsx with working forms for the new attributes (location, birthday, etc.).

Use FancyMultiSelect or plain form inputs to collect data.

Profile preview

Show a live preview of the selected interests and favorites on the customization page.

Update onboarding flow

In app/(auth)/onboarding/page.tsx, chain into the customization modals so new users can provide interests during onboarding.

Persist selections via upsertUserAttributes.

2. Build Interest Capture APIs
REST endpoints

Create API routes (under app/api) for fetching and updating UserAttributes by user ID.

Use server actions internally but expose a JSON API for client components.

Search and suggestion queries

Add queries to return users with overlapping interests or similar attribute vectors (e.g., using Postgres array intersection or embeddings).

Privacy controls

Allow users to toggle visibility of each profile section (public, followers only, private).

3. Implement the Social Discovery Engine
Similarity scoring

Design a scoring algorithm that compares sets of interests, artists, movies, etc.

Consider simple intersection counts first, then weight by popularity or user engagement.

Recommendation service

Provide an endpoint that takes the active user’s attributes and returns recommended profiles or rooms.

Use collaborative filtering on likes and room memberships (as outlined in Mesh_Roadmap.md).

Explore page

Create a new page showing “People you may like” and “Rooms to join,” powered by the recommendation endpoint.

Offer search filters for interests and location.

Periodic updates

Recompute similarity or recommendation scores when a user edits their attributes or engages with new content.

4. UI Integration
Profile page

Surface the saved interests, hobbies, and favorites on each user profile.

Add a “Find similar users” button that links to a filtered list of recommended profiles.

Feed suggestions

Insert recommended threads or rooms into the main feed.

Use metadata from UserAttributes to provide context (“Suggested because you like hiking”).

Notifications

Notify users when a new match appears or when someone with overlapping interests joins a relevant room.

5. Testing and Metrics
Unit tests

Write tests for upsertUserAttributes and the new recommendation logic.

Ensure npm run lint passes on all additions.

Analytics

Track how often profile fields are edited and which recommendations are clicked.

Use this data to refine the similarity algorithm.

By completing these phases, Mesh can gather richer profile data and build a discovery engine that matches users with similar tastes. The existing customization UI and database structures provide a starting point; expanding them and adding recommendation APIs will enable the social discovery experience envisioned in the roadmap.
