"use client";

import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrashBinProps {
  isDragActive: boolean;
}

export function TrashBin({ isDragActive }: TrashBinProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash",
    data: { type: "trash" },
  });

  return (
    <AnimatePresence>
      {isDragActive && (
        <motion.div
          ref={setNodeRef}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{
            scale: isOver ? 1.1 : 1,
            opacity: 1,
          }}
          exit={{
            scale: 0.8,
            opacity: 0,
            transition: { duration: 0.15, ease: "easeIn" },
          }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className={`fixed bottom-2 left-1/2 z-50 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-[18px] border-2 border-dashed shadow-md backdrop-blur-sm ${
            isOver
              ? "border-coral-deep bg-coral/15 shadow-lg"
              : "border-ink-faint/40 bg-surface/90"
          }`}
        >
          <Trash2
            className={`transition-all duration-200 ${
              isOver ? "text-coral-deep h-7 w-7" : "text-ink-faint h-5 w-5"
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
