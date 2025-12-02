interface CwlHeaderProps {
  season: string;
  state: string;
}

export const CWLSeasonHeader = ({ season, state }: CwlHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-bold text-gray-800"> {season} season</h3>
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          state === "ended" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
        }`}
      >
        {state.toUpperCase()}
      </span>
    </div>
  );
};
