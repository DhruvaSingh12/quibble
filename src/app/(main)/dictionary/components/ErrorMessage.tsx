import { FC } from "react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-card w-full h-full p-4 rounded-2xl text-danger text-center">
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
