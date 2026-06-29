import React from "react";
import { FaX } from "react-icons/fa6";

interface ToastNotificationProps {
  title: string;
  description: string;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  title,
  description,
  onClose,
}) => {
  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-background text-foreground rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full text-muted-foreground"
        >
          <FaX size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
