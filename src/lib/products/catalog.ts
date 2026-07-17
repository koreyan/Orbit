export const ORDER_THEME_KEYS = ["career", "love", "hobby"] as const;

export type OrderTheme = (typeof ORDER_THEME_KEYS)[number];

export interface ProductCatalogItem {
  theme: OrderTheme;
  displayName: string;
  amount: number;
  enabled: boolean;
  freeDemo: boolean;
}

export const PRODUCT_CATALOG: Record<OrderTheme, ProductCatalogItem> = {
  career: {
    theme: "career",
    displayName: "나의 잠재력과 커리어",
    amount: 990,
    enabled: false,
    freeDemo: false,
  },
  love: {
    theme: "love",
    displayName: "나만의 매력과 관계",
    amount: 0,
    enabled: true,
    freeDemo: true,
  },
  hobby: {
    theme: "hobby",
    displayName: "나를 채우는 여가와 웰니스",
    amount: 500,
    enabled: false,
    freeDemo: false,
  },
};

export const isOrderTheme = (theme: string): theme is OrderTheme => {
  return ORDER_THEME_KEYS.includes(theme as OrderTheme);
};

export const getProductByTheme = (theme: string): ProductCatalogItem => {
  if (!isOrderTheme(theme)) {
    throw new Error("지원하지 않는 테마입니다.");
  }

  return PRODUCT_CATALOG[theme];
};

export const resolveOrderProduct = ({ theme }: { theme: string; clientAmount: number }): ProductCatalogItem => {
  const product = getProductByTheme(theme);

  if (!product.enabled) {
    throw new Error("현재 주문할 수 없는 테마입니다.");
  }

  return product;
};

export const isFreeDemoPaymentAllowed = (product: ProductCatalogItem): boolean => {
  return product.enabled && product.freeDemo && product.amount === 0;
};
