export interface Building {
  id: string;
  name: string | null;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  year_built: number | null;
  year_demolished: number | null;
  architect: string | null;
  firm: string | null;
  style: string | null;
  height_m: number | null;
  floors: number | null;
  use_type: string | null;
  materials: string[] | null;
  description: string | null;
  osm_id: string | null;
  wikidata_id: string | null;
  verified: boolean;
  images: BuildingImage[] | null;
  sources: BuildingSource[] | null;
  created_at: string;
  updated_at: string;
}

export interface BuildingImage {
  url: string;
  caption: string | null;
  credit: string | null;
}

export interface BuildingSource {
  label: string;
  url: string | null;
}

export interface Contribution {
  id: string;
  building_id: string;
  contributor_id: string | null;
  contributor_username: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface SearchResult {
  id: string;
  name: string | null;
  address: string;
  city: string;
  architect: string | null;
  style: string | null;
  year_built: number | null;
  lat: number;
  lng: number;
}
