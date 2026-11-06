export function TopAlert({
  show = false,
  text,
}: {
  show?: boolean;
  text?: string | null;
}) {
  const message = text?.trim();
  if (!show || !message) return null;

  return (
    <div className="rk-top-alert bg-[var(--gray-700)] text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center text-center">
        <p className="text-base font-extrabold whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}
