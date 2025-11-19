interface ClanDescriptionProps {
  description: string;
}

export const ClanDescription: React.FC<ClanDescriptionProps> = ({
  description,
}) => {
  if (!description) return null;

  return (
    <div className="mt-4 p-4 bg-gray-200 rounded-lg ">
      <p className="font-clashSmall text-gray-700 text-center  italic">
        "{description}"
      </p>
    </div>
  );
};
