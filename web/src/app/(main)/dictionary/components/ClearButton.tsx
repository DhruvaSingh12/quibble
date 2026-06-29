import { FC } from "react";
import { X } from "lucide-react";

interface ClearButtonProps {
  onClick: () => void;
  className?: string;
}

const ClearButton: FC<ClearButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg hover:bg-secondary transition-colors p-1 ${className}`}
      aria-label="Clear search"
    >
      <X size={18}/>
    </button>
  );
};

export default ClearButton;
