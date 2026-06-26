import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Calendario } from "@/pages/Calendario"
import { Commands } from "@/pages/Commands"
import { Configuracoes } from "@/pages/Configuracoes"
import { Dashboard } from "@/pages/Dashboard"
import { Donos } from "@/pages/Donos"
import { Ferramentas } from "@/pages/Ferramentas"
import { Hooks } from "@/pages/Hooks"
import { Login } from "@/pages/Login"
import { McpServers } from "@/pages/McpServers"
import { McpStore } from "@/pages/McpStore"
import { Plugins } from "@/pages/Plugins"
import { Projetos } from "@/pages/Projetos"
import { Rotinas } from "@/pages/Rotinas"
import { SkillDetail } from "@/pages/SkillDetail"
import { Skills } from "@/pages/Skills"
import { Subagents } from "@/pages/Subagents"
import { Vps } from "@/pages/Vps"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projetos" element={<Projetos />} />
        <Route path="vps" element={<Vps />} />
        <Route path="donos" element={<Donos />} />
        <Route path="ferramentas" element={<Ferramentas />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="skills" element={<Skills />} />
        <Route path="skills/:id" element={<SkillDetail />} />
        <Route path="subagents" element={<Subagents />} />
        <Route path="mcp" element={<McpServers />} />
        <Route path="mcp-store" element={<McpStore />} />
        <Route path="hooks" element={<Hooks />} />
        <Route path="commands" element={<Commands />} />
        <Route path="plugins" element={<Plugins />} />
        <Route path="rotinas" element={<Rotinas />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
    </Routes>
  )
}
