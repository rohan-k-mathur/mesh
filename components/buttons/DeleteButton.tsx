import { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

interface Props {
  deleteOnClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

const DeleteButton = ({ deleteOnClick }: Props) => {
  const [isHovering, setIsHovered] = useState(false);
  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => setIsHovered(false);
  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Button
        className="relative px-1 py-3"
        btype="delete"
        onClick={deleteOnClick}
      >
        {isHovering ? (
          <Image
            src="/assets/delete-animated.svg"
            width={24}
            height={24}
            alt="deletea"
          />
        ) : (
          <Image
            src="/assets/delete-static.svg"
            width={24}
            height={24}
            alt="deletes"
          />
        )}
      </Button>
    </div>
  );
};

export default DeleteButton;
