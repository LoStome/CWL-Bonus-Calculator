interface ClanBadgeProps {
  size: "small" | "medium" | "large";
  badgeUrls: {
    small: string;
    medium: string;
    large: string;
  };
}

export const ClanBadge: React.FC<ClanBadgeProps> = ({ size, badgeUrls }) => {
  // Mappa le dimensioni alle classi Tailwind
  const sizeClasses = {
    small: "w-12 h-12", // 48px
    medium: "w-20 h-20", // 80px
    large: "w-32 h-32", // 128px
  };

  const imageUrl = badgeUrls[size];

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0`}>
      <img
        src={imageUrl}
        alt="Clan Badge"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
