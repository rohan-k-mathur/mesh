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
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createAndJoinLounge } from "@/lib/actions/realtimeroom.actions";
import { useAuth } from "@/lib/AuthContext";
import { uploadFileToSupabase } from "@/lib/utils";
import { LoungeValidation } from "@/lib/validations/thread";
import { redirect, usePathname, useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

function CreateLounge() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth().user;
  if (!user?.onboarded) redirect("/onboarding");
  const [imageURL, setImageURL] = useState("");
  const form = useForm({
    resolver: zodResolver(LoungeValidation),
    defaultValues: {
      roomName: "",
      userId: user.userId!,
      roomIcon: "",
      isPublic: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof LoungeValidation>) => {
    const result = await uploadFileToSupabase(values.roomIcon);
    if (result.error) {
      return;
    }
    const lounge = await createAndJoinLounge({
      loungeName: values.roomName,
      roomIcon: result.fileURL,
      isPublic: values.isPublic,
      path: pathname,
    });

    router.push(`/lounges/${lounge.id}`);
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
    <div className="justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-0 flex flex-col justify-center  gap-0  "
        >
          <FormField
            control={form.control}
            name="roomIcon"
            render={({ field }) => (
              <FormItem className="flex items-center mx-auto justify-center w-full gap-4 mt-4 ">
                <FormLabel className="rounded_icon_container border-black border-[1px]  rounded-lg h-[4rem] w-[4rem]">
                  {imageURL != "" ? (
                    <Image
                      src={imageURL}
                      alt="profile photo"
                      width={48}
                      height={48}
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
                <FormControl className=" items-center justify-center  grid flex flex-col w-[50%] text-base-semibold text-gray-200">
                  <Input
                    type="file"
                    accept="image/*"
                    placeholder="Upload a photo"
                    className="account-form_image-input "
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
              <FormItem className="flex flex-col w-full  mt-6 ">
                <FormLabel className="text-[1rem]">Name</FormLabel>
                <FormControl className="border-2 border-slate-500  bg-white text-black hover:border-black focus:border-black">
                  <Input
                    type="text"
                    className="border border-dark-4 text-dark-1  w-full no-focus"
                    placeholder="Enter lounge name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-col   mt-6 ">
                <FormLabel className="text-[1rem]">Visibility</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(v) => field.onChange(v === "public")}
                    value={field.value ? "public" : "private"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[8rem] border-blue rounded-xl">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="likebutton h-fit items-center text-center mx-auto pl-8 pr-4  mt-10 py-4 rounded-full  tracking-[1.2rem] w-fit justify-center text-[1.15rem] bg-transparent outline-blue hover:bg-transparent  "
          >
           <p> Create </p>
            </Button>
        </form>
      </Form>
    </div>
  );
}

export default CreateLounge;
