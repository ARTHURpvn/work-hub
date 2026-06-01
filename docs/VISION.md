# VISION — Visão & Escopo

## Problema
O trabalho do usuário está espalhado: agentes e jobs da Claude rodando em vários lugares, skills sem inventário, tarefas sem prazo conectado à agenda, projetos com origens e infra diferentes (Otávio, Titan, Freelas). Falta um ponto único de controle.

## Visão (uma frase)
Um dashboard pessoal único que conecta **projetos → tarefas (lista e Kanban) → prazos → agentes/jobs/skills da Claude**, com automações de conteúdo (LinkedIn) e melhoria de prompts numa fase seguinte.

## Objetivos
- Centralizar e dar status em tempo (quase) real dos agentes e jobs da Claude.
- Inventariar e criar skills.
- Gerenciar tarefas em duas visões sincronizadas (lista + Kanban) com prazos na agenda.
- Cadastrar projetos com origem, auth e VPS, ligados às tarefas.
- Preparar o terreno para automação de LinkedIn e melhoria de prompts.

## Não-objetivos (agora)
- Multiusuário / colaboração com login de terceiros.
- App mobile nativo (só web responsiva).
- Suporte a provedores de agentes que não sejam a Claude.
- Gestão de segredos/credenciais reais (o app guarda só o IP do SSH).

## Stakeholders
- **Dono/usuário único:** define prioridades, opera o dashboard, fornece contas e chaves.
- **IA construtora (consumidora desta doc):** implementa o sistema a partir do `ROADMAP.md`.

## Métricas de sucesso
- Tempo para ver "o que está rodando agora" cai para alguns segundos, num só lugar.
- 100% das tarefas com prazo aparecem na agenda escolhida.
- Zero vazamento de dado sensível em qualquer conteúdo gerado para o LinkedIn.

## Fases
- **Fase 1 (MVP):** Auth, Projetos, Tarefas (lista+Kanban), Calendário, Agentes, Jobs, Skills.
- **Fase 2:** Cron LinkedIn (rascunho → auto), Avaliação contínua do LinkedIn, Chat de prompts.
