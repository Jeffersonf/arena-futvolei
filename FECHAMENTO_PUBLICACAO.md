# Fechamento e publicacao - Team Lucao

Use este checklist quando a rodada local estiver aprovada e for hora de publicar no GitHub Pages.

## Estado local esperado

- Live local: `http://127.0.0.1:4280/`
- PIN da demo: `1234`
- Versao atual dos assets: `20260603-booking1`
- Service worker atual: `team-lucao-v38`

## Antes de publicar

1. Rodar:

```bash
npm run check
```

2. Com o live server aberto, rodar:

```bash
npm run visual:check
```

3. Conferir no navegador:

- Tela publica de agendamento mobile.
- Login/PIN mobile pelo botao `Acesso professor`.
- Dashboard mobile.
- Aulas mobile.
- Cobrar mobile.
- Pedidos mobile.
- Dashboard desktop.
- Alunos desktop.
- Pedidos desktop.

4. Conferir manualmente no live server:

- Entrar com PIN `1234`.
- Enviar um pedido de aula pela primeira tela.
- Abrir `Pedidos` e aprovar/recusar um pedido.
- Abrir uma aula de hoje e marcar presenca.
- Clicar no nome de um aluno e abrir a ficha.
- Abrir Cobrar e copiar uma cobranca.
- Abrir Espera e ver interessados com prioridade.
- Abrir Mais no mobile e conferir atalhos secundarios.

## Publicacao

1. Confirmar worktree limpo ou somente com mudancas intencionais.
2. Fazer push para `main`.
3. Aguardar o GitHub Pages atualizar.
4. Verificar se o HTML publicado contem a versao atual dos assets.
5. Abrir `https://jeffersonf.github.io/arena-futvolei/` no iPhone.

## Depois de publicar

- Fazer refresh forte se o service worker segurar versao antiga.
- Entrar com PIN `1234`.
- Verificar se o rodape mobile mostra `Inicio`, `Pedidos`, `Alunos`, `Aulas`, `Cobrar`, `Espera`, `Mais`.
- Confirmar que a tela publica de agendamento aparece antes do PIN.
- Confirmar que `Aulas`, `Cobrar` e ficha do aluno carregam com o design novo.
