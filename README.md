# eBanking – Prototip sistema elektronskog bankarstva

Prototip web aplikacije za elektronsko bankarstvo, razvijen kao praktični deo diplomskog rada. Aplikacija demonstrira osnovne principe digitalnog bankarstva: autentifikaciju korisnika, pregled računa, evidenciju transakcija, transfer sredstava, uplatu i isplatu, uz naglasak na bezbednosti i integritetu podataka.

## Tehnologije

- **Next.js 16** – App Router, server i client komponente, API rute
- **PostgreSQL 16** – relaciona baza podataka
- **Prisma ORM** – tipiziran pristup bazi, migracije, transakcije
- **Tailwind CSS + DaisyUI** – responzivan korisnički interfejs
- **bcrypt** – heširanje lozinki
- **JWT** – upravljanje sesijama (httpOnly cookie)
- **Zod** – validacija ulaznih podataka
- **Docker** – lokalno pokretanje PostgreSQL baze

## Preduslov

- Node.js 18+
- Docker (za PostgreSQL) ili lokalna PostgreSQL instanca

## Pokretanje

### 1. Kloniranje repozitorijuma

```bash
git clone https://github.com/jovancvetkovic3006/ebanking.git
cd ebanking
```

### 2. Instalacija zavisnosti

```bash
npm install
```

### 3. Pokretanje baze podataka

```bash
docker compose up -d
```

### 4. Konfiguracija environment varijabli

Kreirati `.env` fajl u korenu projekta:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ebanking"
JWT_SECRET="your-secret-key-change-in-production"
```

### 5. Migracija baze i seed podataka

```bash
npx prisma migrate dev
npm run db:seed
```

### 6. Pokretanje razvojnog servera

```bash
npm run dev
```

Aplikacija je dostupna na [http://localhost:3000](http://localhost:3000).

## Demo nalozi

| Email            | Lozinka    | Uloga |
| ---------------- | ---------- | ----- |
| admin@demo.com   | Admin123!  | ADMIN |
| user@demo.com    | User123!   | USER  |

## Struktura projekta

```
src/
├── app/
│   ├── api/            # API rute (auth, transfer, transactions, admin)
│   ├── admin/          # Admin stranice (korisnici, računi, transakcije, audit)
│   ├── dashboard/      # Glavna stranica sa pregledom računa i transakcija
│   ├── login/          # Prijava
│   ├── register/       # Registracija
│   ├── transfer/       # Transfer sredstava
│   ├── transactions/   # Istorija transakcija
│   └── profile/        # Promena lozinke
├── lib/
│   ├── auth.ts         # JWT autentifikacija
│   ├── prisma.ts       # Prisma klijent
│   └── rate-limit.ts   # Zaštita od brute-force napada
prisma/
├── schema.prisma       # Model baze podataka
├── seed.cjs            # Seed podaci
└── migrations/         # Migracije baze
```

## Funkcionalnosti

- **Autentifikacija** – prijava, registracija, odjava sa JWT sesijama
- **Pregled računa** – stanje i valuta za svaki račun
- **Transfer sredstava** – atomarni transfer između računa sa validacijom
- **Uplata / Isplata** – deposit i withdraw sa dashboard-a
- **Istorija transakcija** – paginiran pregled sa tipom (DEPOSIT, WITHDRAW, TRANSFER)
- **Audit log** – evidencija svih kritičnih akcija (login, logout, register, transfer)
- **Administracija** – pregled korisnika, računa, transakcija i audit zapisa
- **Rate limiting** – zaštita login endpoint-a od brute-force napada
- **FAILED transakcije** – evidencija neuspelih transfera i isplata
- **Responzivan dizajn** – mobilni hamburger meni, prilagodljive tabele
