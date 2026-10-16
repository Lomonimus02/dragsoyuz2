const DEFAULT_ARRIVAL_NOTICE_TEXT =
  "❗️Время прибытия необходимо согласовать заранее❗️";

export function TopAlert({
  show = true,
  text,
}: {
  show?: boolean;
  text?: string | null;
}) {
  if (!show) return null;

  const message = text?.trim() || DEFAULT_ARRIVAL_NOTICE_TEXT;

  return (
    <div className="bg-[var(--gray-700)] text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center text-center">
        <p className="text-base font-extrabold whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}
