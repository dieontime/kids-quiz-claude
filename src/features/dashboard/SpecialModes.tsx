interface Props {
  onSurpriseMix: () => void;
  onTimeAttack: () => void;
  onPracticeMistakes?: () => void;
  practiceCount: number;
}

export function SpecialModes({
  onSurpriseMix,
  onTimeAttack,
  onPracticeMistakes,
  practiceCount,
}: Props) {
  const showPractice = practiceCount > 0 && onPracticeMistakes;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      <button
        onClick={onSurpriseMix}
        className="bg-purple-100 rounded-2xl p-4 sm:p-5 shadow-md hover:scale-[1.02] transition-transform focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none text-left"
      >
        <div className="text-3xl sm:text-4xl">✨</div>
        <div className="text-lg sm:text-xl font-bold text-purple-700 mt-1">Surprise Mix</div>
        <div className="text-xs sm:text-sm text-gray-600 mt-1">A bit of everything</div>
      </button>
      {showPractice && (
        <button
          onClick={onPracticeMistakes}
          className="bg-green-100 rounded-2xl p-4 sm:p-5 shadow-md hover:scale-[1.02] transition-transform focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none text-left"
        >
          <div className="text-3xl sm:text-4xl">📝</div>
          <div className="text-lg sm:text-xl font-bold text-green-700 mt-1">
            Practice Mistakes ({practiceCount})
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Re-do questions you missed
          </div>
        </button>
      )}
      <button
        onClick={onTimeAttack}
        className="bg-orange-100 rounded-2xl p-4 sm:p-5 shadow-md hover:scale-[1.02] transition-transform focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none text-left"
      >
        <div className="text-3xl sm:text-4xl">⏱</div>
        <div className="text-lg sm:text-xl font-bold text-orange-700 mt-1">Time Attack</div>
        <div className="text-xs sm:text-sm text-gray-600 mt-1">Race the clock</div>
      </button>
    </div>
  );
}
