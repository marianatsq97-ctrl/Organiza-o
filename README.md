# FocoJá — Planejamento diário para sair da sobrecarga

Aplicativo web simples para pessoas que se sentem perdidas e sobrecarregadas, com foco em **parar de pensar demais e executar a próxima ação**.

## O que já faz

- Captura rápida de tarefas com campo maior (até 1000 caracteres).
- Priorização automática (alta, média, baixa).
- Edição da prioridade direto na tarefa.
- Campo de **observações** em cada atividade.
- Campo “**em que pé está**” (não iniciada, em andamento, aguardando, bloqueada).
- Destaque da **próxima ação única** para reduzir paralisia.
- Histórico de atividades concluídas com data/hora.
- Aba de gráficos com:
  - Concluídas por prioridade.
  - Ativas por status.
- Bloco de integrações com:
  - Google Agenda
  - ClickUp
  - Notas do celular
  - Outlook
- Fluxo de integração **obrigatório** com e-mail + solicitação de conexão antes de conectar.

> Nesta versão inicial, as integrações estão no fluxo de UI e persistência local. Para integração real com contas, é necessário adicionar OAuth + APIs oficiais.

## Como rodar (passo a passo simples)

### 1) Baixe/clone o projeto
Se estiver no GitHub:

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd Organiza-o
```

### 2) Inicie um servidor local
Na pasta do projeto, rode:

```bash
python3 -m http.server 4173
```

Se no seu computador o comando `python3` não funcionar, tente:

```bash
python -m http.server 4173
```

### 3) Abra no navegador
Com o servidor rodando, abra:

```text
http://localhost:4173
```

Pronto. O app já deve aparecer.

---

## Dúvidas comuns

### “Posso só dar duplo clique no index.html?”
Pode funcionar em alguns casos, mas **o recomendado é usar servidor local** (comando acima), porque é a forma mais estável para evoluir o projeto.

### “Como parar o servidor?”
No terminal onde ele está rodando, pressione:

```text
Ctrl + C
```

### “Como saber se o servidor subiu?”
Você verá algo parecido com:

```text
Serving HTTP on 0.0.0.0 port 4173
```

## Próximos passos para integração real

1. Criar backend (Node/Express ou FastAPI) para OAuth e armazenamento seguro de tokens.
2. Implementar endpoints para Google Calendar API (listar e criar eventos).
3. Implementar integração ClickUp API (tasks/spaces).
4. Sincronização de notas do celular:
   - iOS: via iCloud/atalhos/webhook (dependendo do fluxo desejado).
   - Android: Google Keep API alternativa ou app de notas com API/webhook.
5. Adicionar rotina de sincronização automática e logs.
