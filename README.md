# Comunidade Conectada

Mural digital para moradores divulgarem doações, eventos, oportunidades e serviços da comunidade.

## Funcionalidades

### Acesso público

- consulta de todas as publicações ativas sem login;
- busca por título e descrição;
- filtros por categoria e bairro;
- página de detalhes com imagem, local e contato opcional por WhatsApp.

### Conta do morador

- cadastro com nome, e-mail, senha, CPF e telefone;
- confirmação de e-mail, login, logout e recuperação de senha;
- CPF e telefone vinculados de forma única à conta, sem exposição nos anúncios;
- criação de publicação somente por usuário autenticado com cadastro completo;
- publicação imediata, sem fila de aprovação prévia;
- página para consultar, editar e excluir as próprias publicações;
- imagem opcional com prévia quadrada e formulário adaptado para celular.

### Administração

- área administrativa com sessão protegida;
- resumo e filtros por status e bairro;
- encerramento e exclusão de conteúdo depois da publicação.

## Privacidade e segurança

- autenticação e confirmação de e-mail pelo Supabase Auth;
- propriedade de publicações validada no backend e por políticas RLS;
- CPF e telefone normalizados e armazenados somente como identificadores HMAC e quatro últimos dígitos;
- imagens validadas, convertidas para WebP e salvas sem os metadados originais;
- avisos claros antes da divulgação de imagem e dados de contato.

CPF e telefone reduzem contas duplicadas, mas não comprovam a identidade nem a posse do número. A verificação por SMS depende da configuração futura de um provedor de mensagens.

## Tecnologias

- Next.js e React no frontend;
- FastAPI e SQLAlchemy no backend;
- Supabase Postgres, Auth e Storage;
- SQLite apenas para desenvolvimento e testes isolados.

## Execução local

Backend:

```powershell
cd backend
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Preencha o `.env` com a conexão do banco, chaves do Supabase, `SECRET_KEY`, `ADMIN_PASSWORD_HASH` e uma `PII_HMAC_KEY` exclusiva. `SUPABASE_SECRET_KEY` deve existir somente no backend.

Frontend:

```powershell
cd frontend
Copy-Item .env.local.example .env.local
pnpm install
pnpm dev
```

Configure `BACKEND_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A aplicação fica disponível em `http://localhost:3000`.

## Deploy na Vercel

O `vercel.json` publica o repositório como um projeto de Services: Next.js em `frontend` e FastAPI em `backend`, ambos no mesmo domínio. As rotas `/api/*` são encaminhadas ao backend e as demais ao frontend.

Na Vercel, use a raiz do repositório e o preset Services. Configure as variáveis públicas do Supabase e as variáveis do `backend/.env.example`; em `SUPABASE_DATABASE_URL`, use o Transaction pooler do Supabase na porta 6543. Use também `UPLOAD_DIR=/tmp/uploads`, `COOKIE_SECURE=true` e inclua o domínio público em `ALLOWED_ORIGINS`.
