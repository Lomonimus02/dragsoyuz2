/**
 * Корневой layout для /admin
 * Чистый контейнер без сайдбара, чтобы страница логина не имела лишних элементов.
 * Сайдбар находится в (dashboard)/layout.tsx
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
