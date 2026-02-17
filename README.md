# FocoJá — Planejamento diário para sair da sobrecarga

Aplicativo web simples para pessoas que se sentem perdidas e sobrecarregadas, com foco em **parar de pensar demais e executar a próxima ação**.

## O que já faz

- Captura rápida de tarefas.
- Priorização automática (alta, média, baixa).
- Destaque da **próxima ação única** para reduzir paralisia.
- Controle de energia para orientar o tipo de tarefa.
- Bloco de integrações com:
  - Google Agenda
  - ClickUp
  - Notas do celular
  - Outlook

> Nesta versão inicial, as integrações estão no fluxo de UI (conectar/desconectar) e persistência local. Para integração real com contas, é necessário adicionar OAuth + APIs oficiais.

## Como rodar

```bash
python3 -m http.server 4173
```

Depois abra: `http://localhost:4173`.

## Próximos passos para integração real

1. Criar backend (Node/Express ou FastAPI) para OAuth e armazenamento seguro de tokens.
2. Implementar endpoints para Google Calendar API (listar e criar eventos).
3. Implementar integração ClickUp API (tasks/spaces).
4. Sincronização de notas do celular:
   - iOS: via iCloud/atalhos/webhook (dependendo do fluxo desejado).
   - Android: Google Keep API alternativa ou app de notas com API/webhook.
5. Adicionar rotina de sincronização automática e logs.

