import axios, { type AxiosInstance } from 'axios'
import { mockAdapter } from './mockAdapter'

export const rawHttp: AxiosInstance = axios.create({
  baseURL: '/api',
  adapter: mockAdapter,
})

