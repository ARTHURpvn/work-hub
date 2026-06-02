import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Calendario } from "@/pages/Calendario"
import { Dashboard } from "@/pages/Dashboard"
import { Kanban } from "@/pages/Kanban"
import { Login } from "@/pages/Login"
import { Projetos } from "@/pages/Projetos"
import { SkillDetail } from "@/pages/SkillDetail"
import { Skills } from "@/pages/Skills"
import { Tarefas } from "@/pages/Tarefas"
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
        <Route path="tarefas" element={<Tarefas />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="vps" element={<Vps />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="skills" element={<Skills />} />
        <Route path="skills/:origem/:slug" element={<SkillDetail />} />
      </Route>
    </Routes>
  )
}
