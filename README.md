# Team Lucao Futevolei

MVP leve para escola de futevolei, feito em HTML, CSS e JavaScript puro.

## O que ja faz

- Cadastro rapido de alunos
- Controle de planos e mensalidades
- Agenda de aulas
- Presenca por aula
- Dashboard do dia com pendencias
- Filtros de alunos e aulas
- Acoes rapidas no dashboard
- Busca rapida por aluno/interessado
- Presenca em massa por aula
- Contato rapido por WhatsApp
- Historico recente de pagamentos
- Lista de espera com conversao para aluno
- Backup/importacao em JSON
- Exportacao CSV de alunos, aulas, pagamentos e espera
- Login simples por PIN no servidor
- PWA instalavel no celular
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

## Apresentacao

O roteiro para apresentar a ideia, explicar o valor no dia a dia e mostrar o roadmap esta em `APRESENTACAO.md`.
