'use client';

import { ChevronLeftCircle, ChevronRightCircle } from "lucide-react";

interface BattleLogsPaginationByDayProps {
  page: number;
  onPageChange: (page: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const BattleLogsPaginationByDay: React.FC<BattleLogsPaginationByDayProps> = ({
  page,
  onPageChange,
  hasPrev,
  hasNext
}) => {
  return (
    <div className="flex justify-center mt-4 min-h-[48px] gap-4">
      <button
        onClick={() => {
          console.log('Clicked Prev Page:', page - 1);
          onPageChange(page - 1);
        }}
        disabled={!hasPrev}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        <ChevronLeftCircle className="w-5 h-5" />
      </button>

      <span className="text-sm self-center px-3 py-2 font-medium">
        Page {page + 1}
      </span>

      <button
        onClick={() => {
          console.log('Clicked Next Page:', page + 1);
          onPageChange(page + 1);
        }}
        disabled={!hasNext}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        <ChevronRightCircle className="w-5 h-5" />
      </button>
    </div>
  );
};
