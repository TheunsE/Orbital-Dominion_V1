export type BuildingType = {
  id: number;
  name: string;
  cost: number;
};

export type ResourceDefinition = {
  id: number;
  name:string;
}

export type PlayerAccount = {
  id: string;
  email: string;
  role: string;
}

export type PlayerResource = {
  id: number;
  resource_type: string;
  quantity: number;
}

export type PlayerBuilding = {
  id: number;
  level: number;
  building_types: {
    name: string;
  };
}
