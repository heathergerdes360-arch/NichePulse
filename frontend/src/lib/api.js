import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Inject auth token from a callback (set after AuthContext is ready)
let getToken = () => null
export function setTokenProvider(fn) {
  getToken = fn
}

// Request interceptor — attach Bearer token when available
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api