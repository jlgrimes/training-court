'use client';

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
        Previous
      </button>
      <span className="text-sm self-center">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};
