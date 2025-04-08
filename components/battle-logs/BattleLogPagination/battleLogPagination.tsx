'use client';

import { ChevronLeftCircle, ChevronRightCircle } from "lucide-react";
import React from "react";

interface BattleLogsPaginationProps {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

export const BattleLogsPagination: React.FC<BattleLogsPaginationProps> = ({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPageChange
}) => {
  return (
    <div className="flex justify-center mt-4 min-h-[48px]">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        <ChevronLeftCircle className="w-4 h-4" />
      </button>
      <span className="text-sm self-center px-2 py-2">
        {page + 1} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        <ChevronRightCircle className="fa-regular w-4 h-4" />
      </button>
    </div>
  );
};
