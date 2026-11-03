"use client";

interface ErrorMessageProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <p role="alert" className="error">
      {message}
    </p>
  );
}
