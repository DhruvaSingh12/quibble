import { FC } from "react";
import { FaEraser } from "react-icons/fa";

interface ClearButtonProps {
  onClick: () => void;
  className?: string;
}

const ClearButton: FC<ClearButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg hover:bg-danger-dark ${className}`}
    >
      <FaEraser size={22}/>
    </button>
  );
};

export default ClearButton;
