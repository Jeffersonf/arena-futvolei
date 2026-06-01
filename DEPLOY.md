# Deploy - Team Lucao Futevolei

## Objetivo

Rodar o sistema em um link acessivel pelo iPhone, com banco persistente e backup automatico.

## Requisitos

- Node 22+ com suporte a `node:sqlite`.
- Disco persistente para o arquivo `arena.db`.
- Variavel `ADMIN_PIN` diferente de `1234`.

## Variaveis

```bash
PORT=3020
ADMIN_PIN=troque-este-pin
DB_PATH=/data/arena.db
AUTO_BACKUP_ON_START=true
AUTO_BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION=30
```

## Comando

```bash
npm install
npm start
```

## Checklist antes de entregar para uso real

- Trocar `ADMIN_PIN`.
- Confirmar que `DB_PATH` esta em disco persistente.
- Confirmar que a pasta `backups/` tambem persiste no provedor.
- Criar um backup manual pela tela Dados.
- Testar acesso pelo iPhone.
- Salvar o link na tela inicial do iPhone.

## Observacoes

GitHub Pages continua servindo bem para demo, mas uso real precisa do servidor Node para persistir dados em SQLite e fazer backup automatico. Sem servidor, o modo local usa `localStorage` do navegador.
