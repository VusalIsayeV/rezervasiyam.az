# rezervasiyam.az

Online rezervasiya platforması. Bərbər, gözəllik, restoran və s. üçün.

## Struktur

- `backend/` — FastAPI + fake in-memory DB (sonra MySQL-ə keçiləcək)
- `frontend/` — React + TypeScript + Vite + Tailwind

## Backend-i işə sal

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://localhost:8000
Swagger: http://localhost:8000/docs

**Mentor login:** `mentor@rezervasiyam.az` / `mentor123`

## Frontend-i işə sal

```bash
cd frontend
npm install
npm run dev
```

Açıq: http://localhost:5173

## İş axını

1. Sahibkar qeydiyyatdan keçir (`/register`)
2. Biznes yaradır (`/business/new`) — kateqoriya, xidmət, qiymət, şəkillər
3. **Status: pending** — mentor gözləyir
4. Mentor giriş edir (`/mentor`) və təsdiqləyir
5. Sahibkar panelində (`/dashboard`) iş saatlarını təyin edir
6. Müştərilər `/b/<slug>` üzərindən xidmət seçib rezervasiya edirlər

## Qeyd

- Hazırda data yaddaşda (in-memory) saxlanır — server yenidən başlayanda silinir
- MySQL-ə keçid üçün `backend/app/db.py` və routerlərdə SQLAlchemy session-a dəyişmək lazımdır
- Subdomen routing üçün hələ path (`/b/slug`) istifadə olunur — production-da wildcard DNS + nginx konfiqi lazımdır
