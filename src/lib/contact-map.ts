// Building coordinates from Yandex Maps: Ivana Chernykh Street, 10 (lit. A).
// Keep the pin tied to this address so a future address change in the admin
// cannot silently leave the map pointing at the previous office.
const OFFICE_POINT = "30.280636,59.901356";

export function contactMapLinks(address: string) {
  const normalized = address
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/(^|\s)(г\.?|город|ул\.?|улица)(?=\s)/g, " ")
    .replace(/[^а-яa-z0-9]/g, "")
    .replace(/10a$/, "10а");
  const params = normalized === "санктпетербургиваначерных10а"
    ? new URLSearchParams({ ll: OFFICE_POINT, pt: OFFICE_POINT, z: "17" })
    : new URLSearchParams({ text: address, mode: "search", z: "17" });

  return {
    embed: `https://yandex.ru/map-widget/v1/?${params}`,
    external: `https://yandex.ru/maps/?${params}`,
  };
}
