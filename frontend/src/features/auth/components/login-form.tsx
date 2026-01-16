import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api"
import { jwtDecode } from "jwt-decode"
import type { JWTPayload } from "../type"


export const LoginForm = () => {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        
        try {
            const data = await login({email,password})
            const token = data.accessToken
            console.log(data)
            const decodeUser = jwtDecode<JWTPayload>(token)

            console.log('UserId:', decodeUser)

            localStorage.setItem('accessToken', data.accessToken)
            navigate('/decks')
        } catch (err) {
            console.error(err)
            setError('Ошибка Входа. Проверьте данные')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            <h2>Вход</h2>
      
            {error && <div style={{ color: 'red' }}>{error}</div>}

            <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
            />
            <input 
                type="password" 
                placeholder="Пароль" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
            />
            
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Загрузка...' : 'Войти'}
            </button>
        </form>
    )
}