"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createAndJoinRoom } from "@/lib/actions/realtimeroom.actions";
import { useAuth } from "@/lib/AuthContext";
import { uploadFileToSupabase } from "@/lib/utils";
import { RoomValidation } from "@/lib/validations/thread";
import { redirect, usePathname, useRouter } from "next/navigation";
import { Input } from "../ui/input";

function CreateRoom() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth().user;
  if (!user?.onboarded) redirect("/onboarding");
  const [imageURL, setImageURL] = useState("");
  const form = useForm({
    resolver: zodResolver(RoomValidation),
    defaultValues: {
      roomName: "",
      userId: user.userId!,
      roomIcon: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof RoomValidation>) => {
    const result = await uploadFileToSupabase(values.roomIcon);
    if (result.error) {
      return;
    }
    const room = await createAndJoinRoom({
      roomName: values.roomName,
      roomIcon: result.fileURL,
      path: pathname,
    });

    router.push(`/room/${room.id}`);
  };

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: File) => void
  ) => {
    e.preventDefault();
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      if (!uploadedFile.type.includes("image")) return;
      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        setImageURL(imageDataUrl);
        fieldChange(uploadedFile);
      };
      fileReader.readAsDataURL(uploadedFile);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-0 flex flex-col justify-start gap-5 "
      >
        <FormField
          control={form.control}
          name="roomIcon"
          render={({ field }) => (
            <FormItem className="flex items-center gap-4">
              <FormLabel className="rounded_icon_container h-24 w-24">
                {imageURL != "" ? (
                  <Image
                    src={imageURL}
                    alt="profile photo"
                    width={96}
                    height={96}
                    priority
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src="/assets/profile.svg"
                    alt="profile photo"
                    width={24}
                    height={24}
                    priority
                    className="object-cover"
                  />
                )}
              </FormLabel>
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Input
                  type="file"
                  accept="image/*"
                  placeholder="Upload a photo"
                  className="account-form_image-input"
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roomName"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full ">
              <FormLabel className="text-header-semibold text-dark-2"></FormLabel>
              <FormControl className="border-2 border-slate-500  bg-white text-black hover:border-black focus:border-black">
                <Input
                  type="text"
                  className="border border-dark-4 text-dark-1 w-64 no-focus"
                  placeholder="Enter room name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="create-post-button h-fit w-[20%] ml-0 mt-[1rem] gap-4 bg-white rounded-md "
        >
          Create Room
        </Button>
      </form>
    </Form>
  );
}

export default CreateRoom;
