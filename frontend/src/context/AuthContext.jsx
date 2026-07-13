import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Magic } from 'magic-sdk'
import axios from 'axios'

const magic = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY
  ? new Magic(import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY)
  : null

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check if Magic SDK has an active session
  useEffect(() => {
    async function checkSession() {
      if (!magic) {
        setLoading(false)
        return
      }
      try {
        const isLoggedIn = await magic.user.isLoggedIn()
        if (isLoggedIn) {
          const didToken = await magic.user.getIdToken()
          const metadata = await magic.user.getMetadata()
          setToken(didToken)
          setUser({ email: metadata.email })
        }
      } catch (err) {
        console.warn('Session check failed:', err.message)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = useCallback(async (email) => {
    if (!magic) {
      console.warn('Magic SDK not configured — set VITE_MAGIC_PUBLISHABLE_KEY')
      return
    }
    await magic.auth.loginWithMagicLink({ email })
    const didToken = await magic.user.getIdToken()
    const metadata = await magic.user.getMetadata()
    setToken(didToken)
    setUser({ email: metadata.email })
  }, [])

  const logout = useCallback(async () => {
    if (magic) {
      await magic.user.logout()
    }
    setUser(null)
    setToken(null)
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    magic,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}