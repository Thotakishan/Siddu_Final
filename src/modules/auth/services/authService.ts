import { http } from '../../../shared/api/http'
import { type AuthTokens, type User } from '../../../shared/types/auth'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: User
  tokens: AuthTokens
}

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await http.post<LoginResponse>('/auth/login', payload)
    return res.data
  },
}

