interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        p-2 rounded-lg transition-all duration-200
        ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:scale-95'}
      `}
      title="새로고침"
    >
      <svg
        className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}
