# FocoJá — Planejamento diário para sair da sobrecarga

Aplicativo web simples para pessoas que se sentem perdidas e sobrecarregadas, com foco em **parar de pensar demais e executar a próxima ação**.

## O que já faz

- Captura rápida de tarefas com campo maior (até 1000 caracteres).
- Priorização automática (alta, média, baixa).
- Edição da prioridade direto na tarefa (inclusive depois de criada).
- Classificação de tarefa como:
  - **Diária**
  - **Com prazo de entrega**
  - **Sem prazo estimado**
- Campo de data para entregas com prazo.
- Campo de **observações** em cada atividade.
- Campo “**em que pé está**” (não iniciada, em andamento, aguardando, bloqueada).
- Campo de **tempo estimado** (minutos) por tarefa.
- Destaque da **próxima ação única** para reduzir paralisia.
- Sugestão inteligente de execução rápida (o que fazer agora, o que evitar e estimativa de entrega do backlog).
- Seção “Plano do dia e entregas” com:
  - seleção automática das atividades que cabem no dia (baseado em energia, prioridade, rapidez e urgência);
  - lista de entregas com prazo e sinalização de vencimento/atraso.
- Histórico de atividades concluídas com data/hora.
- Aba de gráficos com **todas as atividades**:
  - Ativas + concluídas por prioridade.
  - Ativas por status.
  - Tempo estimado por prioridade.
  - Tipos de atividade (diária/com prazo/sem prazo).
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
