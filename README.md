# Team Lucao Futevolei

MVP leve para escola de futevolei, feito em HTML, CSS e JavaScript puro.

## O que ja faz

- Cadastro rapido de alunos
- Controle de planos e mensalidades
- Agenda de aulas
- Presenca por aula
- Relatorio individual ao clicar no nome do aluno
- Aulas de hoje com previstos, avulsos e status rapido
- Tipo de aula: regular, experimental, reposicao, avulso ou evento
- Filtros de aulas por data, tipo e status
- Copia rapida da lista da aula e do resumo de presenca
- Dashboard do dia com pendencias
- Filtros de alunos e aulas
- Acoes rapidas no dashboard
- Busca rapida por aluno/interessado
- Presenca em massa por aula
- Contato rapido por WhatsApp
- Historico recente de pagamentos
- Mensalidade marcada no mes filtrado
- Lista de espera com conversao para aluno
- Backup/importacao em JSON
- Exportacao CSV de alunos, aulas, pagamentos e espera
- Login simples por PIN no servidor
- PWA instalavel no celular
- Fluxo pensado para uso rapido no iPhone
- Layout otimizado para navegador mobile
- Navegacao mobile no rodape para ganhar espaco de tela
- Tela Mais no mobile para atalhos secundarios sem lotar o rodape
- Lembra a ultima aba aberta e melhora fechamento de busca/modal
- Faixa de foco no dashboard com proxima aula, cobrancas e interessado parado
- Backend Node/SQLite inspirado no FinClinica
- Fallback local com `localStorage` ao abrir o HTML direto

## Como abrir

Servidor completo:

```bash
npm install
npm start
```

PIN padrao do piloto:

```text
1234
```

Para trocar o PIN no servidor:

```bash
set ADMIN_PIN=2468
npm start
```

Depois acesse:

```text
http://localhost:3020
```

Tambem da para abrir `index.html` diretamente no navegador para usar em modo local.

## Uso real online

Para rodar como sistema de uso diario, use o servidor Node com SQLite persistente. Configure pelo menos:

```bash
ADMIN_PIN=troque-este-pin
DB_PATH=/caminho/persistente/arena.db
BACKUPS_DIR=/caminho/persistente/backups
AUTO_BACKUP_ON_START=true
AUTO_BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION=30
```

Backups JSON ficam em `backups/`. O servidor cria um backup ao iniciar por padrao e, se `AUTO_BACKUP_INTERVAL_HOURS` for maior que zero, cria backups periodicos. A retencao padrao guarda os 30 backups mais recentes.

Endpoints uteis no servidor:

- `GET /health`: status publico.
- `GET /api/backups`: lista backups.
- `GET /api/backups/:filename`: baixa um backup especifico.
- `POST /api/backups/create`: cria backup manual.
- `GET /api/backup.json`: baixa snapshot JSON.
- `GET /api/db/download`: baixa o SQLite.

Todos os endpoints `/api/*`, exceto login, exigem header `X-Admin-Pin`.

## Apresentacao

O roteiro para apresentar a ideia, explicar o valor no dia a dia e mostrar o roadmap esta em `APRESENTACAO.md`.

O checklist pratico para ensaiar a demo esta em `CHECKLIST_DEMO.md`.
