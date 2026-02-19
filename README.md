# FocoJá — Planejamento diário para sair da sobrecarga

Aplicativo web para organizar **trabalho** e **pessoal/casa** em abas separadas.

## O que já faz

- Aba separada para **Atividades de Trabalho**.
- Aba separada para **Atividades Pessoal/Casa**.
- Classificação por prioridade, tipo (diária/com prazo/sem prazo), estimativa e andamento.
- Seleção automática do que fazer no dia por contexto (trabalho ou pessoal/casa).
- Lista de entregas com prazo no contexto atual.
- Aba de gráficos com:
  - gráfico das atividades de **trabalho**;
  - gráfico das atividades de **pessoal/casa**.
- Histórico de atividades concluídas.

## Como rodar

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173`.


## Publicação no GitHub Pages (quando não atualiza)

Se o site não refletir a última versão:


### Importante no seu caso (print com branch `principal`)
Seu GitHub Pages está configurado para **Implantar a partir de uma ramificação** usando **`principal`**.  
Então só atualiza quando o commit entra nessa branch.


1. Garanta que o commit foi enviado para o GitHub:
   ```bash
   git push origin <sua-branch>
   ```
2. Se a publicação usa `main` **ou** `principal`, faça merge da PR na branch configurada em **Settings > Pages**.
3. Force atualização no navegador:
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
4. Se ainda mostrar versão antiga, abra em aba anônima e confira o selo de versão no topo (ex.: `2026.02.17-2`).

> Esta versão já inclui cache-busting em `styles.css` e `app.js` via query string (`?v=...`).


5. Se persistir, use o botão **Forçar atualização do app** na interface (ele limpa cache/service worker e recarrega com versão).


## Publicação automática no GitHub Pages (configurado)

Este repositório agora possui workflow em `.github/workflows/deploy-pages.yml`.

Como funciona:
- A cada `push` na branch `main` **ou** `principal`, o GitHub Actions publica automaticamente no Pages.
- Você também pode rodar manualmente em **Actions > Deploy static site to GitHub Pages > Run workflow**.

Se ainda não atualizou no seu link:
1. Confirme se o commit está na branch de publicação (`principal` no seu print, ou `main`).
2. Abra **Actions** e verifique se o workflow `Deploy static site to GitHub Pages` concluiu com sucesso.
3. Faça hard refresh no navegador (`Ctrl+F5` / `Cmd+Shift+R`).
4. Abra em aba anônima.
