import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = '/api'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 恢复登录状态：从 localStorage 读 token
    const token = localStorage.getItem('novelstudio_token')
    const savedUser = localStorage.getItem('novelstudio_user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '登录失败' }))
      throw new Error(err.detail || '用户名或密码错误')
    }
    const data = await res.json()
    // token 和用户信息存 localStorage
    localStorage.setItem('novelstudio_token', data.token)
    localStorage.setItem('novelstudio_user', JSON.stringify(data.user))
    setUser(data.user)
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem('novelstudio_token')
    localStorage.removeItem('novelstudio_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// 工具函数：请求时自动附加 token
export function authHeaders() {
  const token = localStorage.getItem('novelstudio_token')
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}
