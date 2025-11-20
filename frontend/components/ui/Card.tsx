interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div
        className={`bg-white rounded-xl shadow p-6 clash-style-border ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
