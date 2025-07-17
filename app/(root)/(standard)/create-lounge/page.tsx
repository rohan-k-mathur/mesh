import CreateLounge from "@/components/forms/CreateLounge";

export const dynamic = "force-dynamic";

async function Page() {
  return (
    <div className="flex flex-col items-center justify-center ">
      <h1 className="head-text text-center items-center justify-center mb-4 ">Create New Lounge</h1>
      <CreateLounge />
    </div>
  );
}

export default Page;
