"use client";

import { useEffect, useRef } from "react";
import Scrollbar from "smooth-scrollbar";
import OverscrollPlugin from "smooth-scrollbar/plugins/overscroll";
import clsx from "clsx";

interface ScrollListProps {
  children: React.ReactNode[];
}

export default function ScrollList({ children }: ScrollListProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    Scrollbar.use(OverscrollPlugin);
    const scrollbar = Scrollbar.init(wrapperRef.current, {
      plugins: { overscroll: true },
    });

    const handle = () => {
      const top = scrollbar.offset.y;
      const items = wrapperRef.current!.querySelectorAll<HTMLDivElement>(
        ".js-scroll-list-item"
      );
      let focused = false;
      items.forEach((el, idx) => {
        el.classList.remove("item-focus", "item-next", "item-hide");
        const relTop = el.offsetTop;
        if (!focused && relTop >= top) {
          el.classList.add("item-focus");
          const next = items[idx + 1];
          if (next) next.classList.add("item-next");
          focused = true;
        } else if (!focused) {
          el.classList.add("item-hide");
        }
      });
    };

    scrollbar.addListener(handle);
    handle();
    return () => {
      scrollbar.removeListener(handle);
      scrollbar.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="scroll-list__wrp js-scroll-list">
      <div className="js-scroll-content">{children}</div>
    </div>
  );
}
