import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { MoreVertical } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

interface Props {
  modalContent: React.ReactNode;
  isOwned: boolean;
  deleteOnClick: () => void;
}

export default function NodeDropdown({
  modalContent,
  isOwned,
  deleteOnClick,
}: Props) {
  const store = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );
  return (
    <DropdownMenu modal={false}>
      {isOwned && (
        <DropdownMenuTrigger asChild>
          <div>
            <MoreVertical className="h-4 w-4" color="#000000" />
            <span className="sr-only">Open menu</span>
          </div>
        </DropdownMenuTrigger>
      )}
      {isOwned && (
        <DropdownMenuContent className="bg-gray-800 shadow-lg rounded-lg border border-gray-700">
          <DropdownMenuItem
            className="text-gray-300 focus:bg-gray-700"
            onClick={() => store.openModal(modalContent)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            className="text-red-400 focus:bg-red-100 focus:bg-red-900/30"
            onClick={deleteOnClick}
          >
            Delete Node
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
