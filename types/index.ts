export interface Building {
  id: string;
  name: string | null;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;

  // Core facts
  year_built: number | null;
  year_demolished: number | null;
  architect: string | null;
  firm: string | null;
  style: string | null;
  movement: string | null;

  // Physical
  height_m: number | null;
  floors: number | null;
  floor_area_m2: number | null;
  site_area_m2: number | null;
  units: number | null;
  use_type: string | null;
  structural_system: string | null;
  materials: string[] | null;

  // Sustainability
  leed_rating: string | null;
  breeam_rating: string | null;
  energy_rating: string | null;
  carbon_footprint: string | null;
  sustainability_notes: string | null;

  // Recognition
  awards: BuildingAward[] | null;
  heritage_status: string | null;
  listed_grade: string | null;

  // Description & media
  description: string | null;
  images: BuildingImage[] | null;
  floorplans: BuildingImage[] | null;
  sources: BuildingSource[] | null;

  // External IDs
  osm_id: string | null;
  wikidata_id: string | null;

  // Meta
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuildingImage {
  url: string;
  caption: string | null;
  credit: string | null;
}

export interface BuildingAward {
  name: string;
  year: number | null;
  organization: string | null;
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
