import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查本地存储的登录状态
    const saved = localStorage.getItem('novelstudio_user')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    // 演示模式：硬编码一个账号
    if (username === 'littleee' && password === 'little2026') {
      const userData = { username, displayName: '创作者', role: 'writer' }
      localStorage.setItem('novelstudio_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    }
    throw new Error('用户名或密码错误')
  }

  const logout = () => {
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
