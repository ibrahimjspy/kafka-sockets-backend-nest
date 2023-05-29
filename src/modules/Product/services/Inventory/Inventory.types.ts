export interface AttributesType {
  attribute: {
    name: string;
  };
  values: {
    name: string;
  }[];
}
export interface VariantListType {
  id: string | number;
  color: string;
  size: string;
  sku: string;
  quantity: number;
  quantityAllocated: number;
}
export interface CheckInColorType {
  color: string;
  size: string;
  quantity: number;
}

export interface CheckInInputType {
  id: string;
  variants: CheckInColorType[];
}
