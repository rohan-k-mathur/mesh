"use client";

import { useState } from "react";
import { UserAttributes } from "@prisma/client";
import AccountProfile from "@/components/forms/AccountProfile";
import CustomButtons from "@/app/(root)/(standard)/profile/[id]/customize/customize-components";
import { useRouter } from "next/navigation";
import Button from "antd/lib/Button";
interface UserData {
  authId: string;
  userId: bigint | null;
  username: string;
  name: string;
  bio: string | null;
  image: string | null;
}

interface Props {
  userData: UserData;
  userAttributes: UserAttributes;
}

export default function OnboardingFlow({ userData, userAttributes }: Props) {
  const [step, setStep] = useState<"profile" | "customize">("profile");
  const router = useRouter();

  const handleProfileComplete = () => {
    setStep("customize");
  };

  const finishOnboarding = () => {
    router.push("/room/global");
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col justify-center items-center px-10 py-10 text-black">
      {step === "profile" && (
        <>
          <h1 className="head-text">Edit Your Profile</h1>
          <section className="postcard mt-5 bg-white bg-opacity-20 p-10 text-black">
            <AccountProfile user={userData} btnTitle="Continue" onSuccess={handleProfileComplete} />
          </section>
        </>
      )}
      {step === "customize" && (
        <>
          <h1 className="head-text relative">Customize Profile</h1>
          <CustomButtons userAttributes={userAttributes} initialOpen />
          <Button onClick={finishOnboarding} className="flex flex-row mt-[48rem] bg-white px-5 py-2 rounded-md z-100">
            Finish
          </Button>
        </>
      )}
    </main>
  );
}
