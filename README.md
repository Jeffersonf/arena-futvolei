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
- Central de acoes com historico de professor, aluno e sistema
- Origem da acao persistida no servidor para separar aluno, professor e sistema
- Atualizacao leve da central de acoes quando outra aba ou aluno registra novidade
- Sincronizacao entre abas no modo local/demo pelo mesmo navegador
- Filtros de alunos e aulas
- Acoes rapidas no dashboard
- Busca rapida por aluno/interessado
- Presenca em massa por aula
- Contato rapido por WhatsApp
- Historico recente de pagamentos
- Fechamento mensal copiavel com receita, presenca, aulas, avulsos, pedidos e espera
- Mensalidade marcada no mes filtrado
- Lista de espera com conversao para aluno
- Backup JSON pelo painel operacional
- Login simples por PIN no servidor
- Primeira tela publica para o aluno pedir vaga em uma aula
- Fila de pedidos para professor aprovar ou recusar
- Limite de capacidade considerado antes de aceitar pedidos
- PWA instalavel no celular
- Fluxo pensado para uso rapido no iPhone
- Layout otimizado para navegador mobile
- Renderizacao local agrupada para reduzir travadas em celular
- Navegacao mobile no rodape para ganhar espaco de tela
- Tela Mais no mobile para atalhos secundarios sem lotar o rodape
- Cards mobile mais compactos, com acoes em trilho horizontal
- Polimento visual global para desktop e iPhone
- Dashboard com contexto visual de agenda, cobranca e conversao
- Estados visuais nos cards de alunos, aulas, cobrancas e espera
- Ficha do aluno redesenhada com perfil, plano, pagamento e frequencia
- Presenca com resumo visual da aula e destaque de presentes
- Modais, estados vazios e fluxos operacionais com acabamento visual
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

Live local usado durante o polimento visual:

```bash
npm run live
```

Depois acesse:

```text
http://127.0.0.1:4280/
```

QA visual local:

```bash
npm run visual:check
```

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
- `GET /api/public/classes`: aulas futuras disponiveis para pedido de vaga.
- `POST /api/public/bookings`: cria pedido publico de aula.
- `GET /api/public/student-classes`: aluno busca proximas aulas pelo WhatsApp.
- `POST /api/public/student-confirm`: aluno confirma se vai ou nao vai.
- `GET /api/bookings`: lista pedidos para o professor.
- `POST /api/bookings/:id/respond`: aprova ou recusa um pedido.
- `GET /api/backups`: lista backups.
- `GET /api/backups/:filename`: baixa um backup especifico.
- `POST /api/backups/create`: cria backup manual.
- `GET /api/backup.json`: baixa snapshot JSON.
- `GET /api/db/download`: baixa o SQLite.

Todos os endpoints `/api/*`, exceto login e rotas `/api/public/*`, exigem header `X-Admin-Pin`.

## Apresentacao

O roteiro para apresentar a ideia, explicar o valor no dia a dia e mostrar o roadmap esta em `APRESENTACAO.md`.

O checklist pratico para ensaiar a demo esta em `CHECKLIST_DEMO.md`.

O checklist para fechar a rodada local e publicar no GitHub Pages esta em `FECHAMENTO_PUBLICACAO.md`.

O guia para colocar em operacao real com servidor, iPhone e backups esta em `OPERACAO_REAL.md`.

## GitHub Pages x uso real

GitHub Pages serve para demonstrar a interface e validar o fluxo visual. Para operacao diaria, use o backend Node:

- pedidos publicos de vaga compartilhados;
- confirmacao do aluno pelo link;
- presenca e mensalidade salvas entre dispositivos;
- backup automatico;
- acesso confiavel pelo iPhone do professor.

Sem backend online, o app mostra `Modo demo/local` e salva dados apenas no navegador atual.
