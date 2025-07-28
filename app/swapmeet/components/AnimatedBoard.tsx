"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function AnimatedBoard({ children }: { children: ReactNode }) {
  const key = usePathname();       // unique per section

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
