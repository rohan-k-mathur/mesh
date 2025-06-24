"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FancyMultiSelect } from "@/components/ui/multiselect";
import {
  convertListToSelectables,
  fetchAlbums,
  fetchArtists,
  fetchInterests,
  fetchMovies,
  fetchTracks,
  submitEdits,
} from "@/lib/MultiSelectFunctions";
import { UserAttributes } from "@prisma/client";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Props {
  userAttributes: UserAttributes;
}

export default function CustomButtons({ userAttributes }: Props) {
  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isBirthdayOpen, setBirthdayOpen] = useState(false);
  const [isLocationOpen, setLocationOpen] = useState(false);
  const [isInterestsOpen, setInterestsOpen] = useState(false);
  const [isHobbiesOpen, setHobbiesOpen] = useState(false);
  const [isCommunitiesOpen, setCommunitiesOpen] = useState(false);
  const [isEventsOpen, setEventsOpen] = useState(false);
  const [isMoviesOpen, setMoviesOpen] = useState(false);
  const [isTVOpen, setTVOpen] = useState(false);
  const [isBooksOpen, setBooksOpen] = useState(false);
  const [isPodcastsOpen, setPodcastsOpen] = useState(false);
  const [isArtistsOpen, setArtistsOpen] = useState(false);
  const [isAlbumsOpen, setAlbumsOpen] = useState(false);
  const [isTracksOpen, setTracksOpen] = useState(false);
  const path = usePathname();

  return (
    <div className="absolute flex flex-wrap grid-auto-row-dense w-fit	max-w-[70rem] items-start justify-left gap-10  mt-24  ">
      <div className="relative grid p-5 gap-3 w-fit  border-2 border-white rounded-md pb-7 text-white  font-semibold">
        {"Bio"}

        {/* About Modal */}
        <Dialog open={isAboutOpen} onOpenChange={setAboutOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              About Me
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>About Me</h2>
            <DialogHeader className="dialog-header text-white tracking-wide	">
              <b> Write anything you&apos; d like to here</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6 pb-[4rem] mt-3 mb-3 ">
              {/* <FancyMultiSelect_Interests /> */}
            </div>
            <hr />
            <div className="flex gap-4 ">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>

        {/* Birthday Modal */}
        <Dialog open={isBirthdayOpen} onOpenChange={setBirthdayOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Birthday
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Birthday</h2>
            <DialogHeader className="dialog-header text-white tracking-wide	">
              <b> Enter your date of birth:</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6 pb-[4rem] mt-3 mb-3 ">
              {/* <FancyMultiSelect_Interests /> */}
            </div>
            <hr />
            <div className="flex gap-4 ">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>

        {/* Location Modal */}
        <Dialog open={isLocationOpen} onOpenChange={setLocationOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Location
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Location</h2>
            <DialogHeader className="dialog-header text-white tracking-wide	">
              <b>Enter your location if you&apos; d like to</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6 pb-[4rem] mt-3 mb-3 ">
              {/* <FancyMultiSelect_Interests /> */}
            </div>
            <hr />
            <div className="flex gap-4 ">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative grid p-5 gap-3 w-fit  border-2 border-white rounded-md pb-7 text-white  font-semibold">
        {"Activities"}

        {/* Interests Modal */}
        <Dialog open={isInterestsOpen} onOpenChange={setInterestsOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Interests
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Interests</h2>
            <DialogHeader className="dialog-header text-white tracking-wide	">
              <b> What are you into?</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6 pb-[4rem] mt-3 mb-3 ">
              <FancyMultiSelect
                fetchMultiselectData={fetchInterests}
                initialSelected={convertListToSelectables(
                  userAttributes.interests
                )}
                submitEdits={(selectables) =>
                  submitEdits("INTERESTS", selectables, userAttributes, path)
                }
              />
            </div>
            <hr />
            <div className="flex gap-4 ">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hobbies Modal */}
        <Dialog open={isHobbiesOpen} onOpenChange={setHobbiesOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Hobbies
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Hobbies</h2>
            <DialogHeader className="dialog-header text-white tracking-wide	">
              <b> What do you enjoy doing?</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6 pb-[4rem] mt-3 mb-3 ">
              <FancyMultiSelect
                fetchMultiselectData={fetchInterests}
                initialSelected={convertListToSelectables(
                  userAttributes.interests
                )}
                submitEdits={(selectables) =>
                  submitEdits("INTERESTS", selectables, userAttributes, path)
                }
              />
            </div>
            <hr />
            <div className="flex gap-4 ">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>

        {/* Communities Modal */}
        <Dialog open={isCommunitiesOpen} onOpenChange={setCommunitiesOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-fit rounded-md">
              Communities
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Communities</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> What communities are you a part of?</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              {/* <FancyMultiSelect /> */}
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>

        {/* Events Modal */}
        <Dialog open={isEventsOpen} onOpenChange={setEventsOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Events
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Events</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Where are you headed this weekend?</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              {/* <FancyMultiSelect /> */}
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid p-5 w-fit gap-3  border-2 border-white rounded-md pb-7 text-white  font-semibold ">
        {"Media"}

        {/* Movies Modal */}
        <Dialog open={isMoviesOpen} onOpenChange={setMoviesOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Movies
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Movies</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite Films</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              <FancyMultiSelect
                fetchMultiselectData={fetchMovies}
                initialSelected={convertListToSelectables(
                  userAttributes.movies
                )}
                submitEdits={(selectables) =>
                  submitEdits("MOVIES", selectables, userAttributes, path)
                }
              />
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* TV Modal */}
        <Dialog open={isTVOpen} onOpenChange={setTVOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-fit rounded-md">
              Television
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Televisoin</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite TV Shows</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              {/* <FancyMultiSelect /> */}
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>

        {/* Books Modal */}
        <Dialog open={isBooksOpen} onOpenChange={setBooksOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Books
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Books</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite Books</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              {/* <FancyMultiSelect /> */}
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>

        {/* Podcasts Modal */}
        <Dialog open={isPodcastsOpen} onOpenChange={setPodcastsOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Podcasts
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Podcasts</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite Podcasts</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              {/* <FancyMultiSelect /> */}
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entermovie"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
            <div className="overlay w-full bg-white h-full text-center align-middle	 font-bold text-black">
              {"UNDER CONSTRUCTION"}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid p-5 w-fit gap-3 border-2 border-white rounded-md pb-7 text-white  font-semibold ">
        {"Music"}

        {/* Artists Modal */}
        <Dialog open={isArtistsOpen} onOpenChange={setArtistsOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Artists
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Artists</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite Artists</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              <FancyMultiSelect
                fetchMultiselectData={fetchArtists}
                initialSelected={convertListToSelectables(
                  userAttributes.artists
                )}
                submitEdits={(selectables) =>
                  submitEdits("ARTISTS", selectables, userAttributes, path)
                }
              />
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="enterartists"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* Albums Modal */}
        <Dialog open={isAlbumsOpen} onOpenChange={setAlbumsOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Albums
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Albums</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite Albums</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              <FancyMultiSelect
                fetchMultiselectData={fetchAlbums}
                initialSelected={convertListToSelectables(
                  userAttributes.albums
                )}
                submitEdits={(selectables) =>
                  submitEdits("ALBUMS", selectables, userAttributes, path)
                }
              />
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="enteralbums"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tracks Modal */}
        <Dialog open={isTracksOpen} onOpenChange={setTracksOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="flex w-full rounded-md">
              Tracks
            </Button>
          </DialogTrigger>
          <DialogContent className="grid bg-black  max-w-[50rem] max-h-[38rem]	">
            <h2>Tracks</h2>
            <DialogHeader className="dialog-header mt-[-2rem] text-white tracking-wide	">
              <b> Choose Your Favorite Songs</b>
            </DialogHeader>
            <hr />

            <div className="bg-black border border-white rounded-md px-3 pt-6  pb-16  mt-3 mb-3 ">
              <FancyMultiSelect
                fetchMultiselectData={fetchTracks}
                initialSelected={convertListToSelectables(userAttributes.songs)}
                submitEdits={(selectables) =>
                  submitEdits("TRACKS", selectables, userAttributes, path)
                }
              />
            </div>
            <hr />
            <div className="flex gap-4 mb-2 mt-2">
              <DialogClose
                id="entertracks"
                type="submit"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Enter
              </DialogClose>

              <DialogClose
                id="close"
                className={`form-submit-button pl-4 py-1 pr-[1rem]`}
              >
                Close
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
