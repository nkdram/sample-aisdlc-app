interface ErrorMessageProps {
  message: string;
}

/** Validation message; the parent decides when there is one. */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p role="alert" className="error">
      {message}
    </p>
  );
}
