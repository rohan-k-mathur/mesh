import CreateRoom from "@/components/forms/CreateRoom";

export const dynamic = "force-dynamic";

async function Page() {
  return (
    <>
      <h1 className="head-text">Create Room</h1>
      <CreateRoom />
    </>
  );
}

export default Page;
