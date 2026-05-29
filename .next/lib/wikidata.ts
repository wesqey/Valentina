export interface WikidataBuilding {
  item: string;
  itemLabel: string;
  architectLabel?: string;
  inceptionDate?: string;
  styleLabel?: string;
  height?: string;
  floors?: string;
  coords?: string;
}

export async function queryBuildingByWikidataId(id: string): Promise<WikidataBuilding | null> {
  const query = `
    SELECT ?item ?itemLabel ?architectLabel ?inceptionDate ?styleLabel ?height ?floors WHERE {
      BIND(wd:${id} AS ?item)
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL { ?item wdt:P149 ?style. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P1101 ?floors. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json" },
    });
    const data = await res.json();
    const bindings = data.results?.bindings;
    if (!bindings?.length) return null;

    const b = bindings[0];
    return {
      item: b.item?.value,
      itemLabel: b.itemLabel?.value,
      architectLabel: b.architectLabel?.value,
      inceptionDate: b.inceptionDate?.value,
      styleLabel: b.styleLabel?.value,
      height: b.height?.value,
      floors: b.floors?.value,
    };
  } catch {
    return null;
  }
}

export async function searchBuildingOnWikidata(name: string, city: string): Promise<WikidataBuilding[]> {
  const query = `
    SELECT DISTINCT ?item ?itemLabel ?architectLabel ?inceptionDate ?styleLabel ?height WHERE {
      ?item wdt:P31/wdt:P279* wd:Q41176.
      ?item rdfs:label ?label.
      FILTER(CONTAINS(LCASE(?label), LCASE("${name.replace(/"/g, "")}")))
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL { ?item wdt:P149 ?style. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 5
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json" },
    });
    const data = await res.json();
    return (data.results?.bindings || []).map((b: Record<string, { value: string }>) => ({
      item: b.item?.value,
      itemLabel: b.itemLabel?.value,
      architectLabel: b.architectLabel?.value,
      inceptionDate: b.inceptionDate?.value,
      styleLabel: b.styleLabel?.value,
      height: b.height?.value,
    }));
  } catch {
    return [];
  }
}
