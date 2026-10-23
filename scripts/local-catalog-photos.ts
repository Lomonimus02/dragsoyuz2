// Original user photographs; category illustrations may represent a family,
// while product assignments below match the model shown in the photograph.
const photo = (filename: string) => `/images/catalog-photos/${filename}.png`;

export const categoryPhotos: Record<string, string> = {
  mikroshemy: photo("ic-133la3"),
  "mikroshemy-voennye": photo("ic-133la3"),
  kondensatory: photo("km-green"),
  "kondensatory-km": photo("km-green"),
  tranzistory: photo("transistor-kt962a"),
  razemy: photo("connector-snp58"),
  rele: photo("relay-res10"),
  rezistory: photo("resistor-pp3-43"),
};

export const productPhotos: Record<string, string> = {
  "133la3": photo("ic-133la3"),
  "km-5-zelenyy": photo("km-green"),
  "km-6-oranzhevyy": photo("km-orange"),
  "res-10": photo("relay-res10"),
  "pp3-43": photo("resistor-pp3-43"),
};
