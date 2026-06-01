import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "@fontsource-variable/inter"
import App from "./App"
import { ConfirmRoot } from "./components/ui/confirm-dialog"
import { Toaster } from "./components/ui/toaster"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
        <ConfirmRoot />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
