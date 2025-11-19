// components/clan/InfoRow.tsx
interface InfoRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  highlight = false,
}) => {
  return (
    <div className="flex justify-between items-center">
      <span className="clash-style-text-small">{label}</span>
      <span
        className={`clash-style-text-small ${
          highlight ? "text-amber-200" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
};
