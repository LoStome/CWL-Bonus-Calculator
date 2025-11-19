interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  className = "",
}) => {
  return (
    <h2
      className={`text-xl text-amber-200 mb-4 clash-style-text-medium ${className}`}
    >
      {children}
    </h2>
  );
};
