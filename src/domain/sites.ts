const SUBCUTANEOUS_SITES = [
  'Upper-left abdomen',
  'Upper-right abdomen',
  'Lower-left abdomen',
  'Lower-right abdomen',
  'Left flank',
  'Right flank'
];

const INTRAMUSCULAR_SITES = [
  'Left deltoid',
  'Right deltoid',
  'Left quadriceps',
  'Right quadriceps',
  'Left gluteal',
  'Right gluteal',
  'Left latissimus dorsi',
  'Right latissimus dorsi',
  'Left trapezius',
  'Right trapezius'
];

export function sitesForRoute(route: string) {
  if (route === 'subcutaneous') return SUBCUTANEOUS_SITES;
  if (route === 'intramuscular') return INTRAMUSCULAR_SITES;
  return [];
}

export function suggestSite(route: string, recentSites: string[]) {
  const options = sitesForRoute(route);
  if (!options.length) return undefined;

  const rank = new Map<string, number>();
  recentSites.forEach((site, index) => {
    if (!rank.has(site)) rank.set(site, index);
  });

  const neverUsed = options.find((site) => !rank.has(site));
  if (neverUsed) return neverUsed;

  return [...options].sort((a, b) => (rank.get(b) ?? 0) - (rank.get(a) ?? 0))[0];
}
