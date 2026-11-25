import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '@dashboard/shared';
import { fetchApi } from '../services/api';
import { UUID_USUARIOS, resolverUsuarioToken } from '../constants/ids';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  loginComo: (usuarioId: string) => void;
  usuariosDisponiveis: { id: string; nome: string; perfil: string; email: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const usuariosDisponiveis = [
    { id: UUID_USUARIOS.RICK, nome: 'Rick (Colaborador)', perfil: 'Admin (Agência)', email: 'rickphtb@gmail.com' },
    { id: UUID_USUARIOS.ADMIN, nome: 'Ricardo Cardoso', perfil: 'Diretor (Agência)', email: 'admin@agencia.com' },
    { id: UUID_USUARIOS.GESTOR, nome: 'Mariana Gestora', perfil: 'Gestor (3 Clientes)', email: 'gestor@agencia.com' },
    { id: UUID_USUARIOS.CLIENTE_01, nome: 'Carlos Mendes', perfil: 'Cliente (TechNova)', email: 'carlos@technova.com.br' },
  ];

  const carregarUsuario = async (userId: string) => {
    const tokenResolvido = resolverUsuarioToken(userId);
    try {
      setCarregando(true);
      localStorage.setItem('auth_token', tokenResolvido);
      const res = await fetchApi<{ usuario: Usuario }>('/auth/me');
      setUsuario(res.usuario);
    } catch (err) {
      console.error('Falha ao autenticar:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const savedToken = resolverUsuarioToken(localStorage.getItem('auth_token'));
    carregarUsuario(savedToken);
  }, []);

  const loginComo = (usuarioId: string) => {
    carregarUsuario(usuarioId);
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, loginComo, usuariosDisponiveis }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return context;
};

