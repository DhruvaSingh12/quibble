import { FC } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-card rounded-b-2xl w-full p-4 sm:p-6">
      <div className="flex items-center gap-3 text-destructive">
        <AlertCircle size={20} className="flex-shrink-0" />
        <p className="text-sm break-words">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
