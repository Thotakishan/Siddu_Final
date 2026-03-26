export enum Role {
  Admin = 'ADMIN',
  InventoryManager = 'INVENTORY_MANAGER',
  SalesManager = 'SALES_MANAGER',
  Support = 'SUPPORT',
  Customer = 'CUSTOMER',
}

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresAtMs: number
}

