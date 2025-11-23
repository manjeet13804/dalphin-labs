# Plinko Lab - Provably Fair Game

A full-stack interactive Plinko game with provably-fair commit-reveal RNG protocol, deterministic seed-replayable outcomes, and polished UI/UX.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Initialize database
npm run prisma:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` to play the game.

### Environment Variables

Create `.env.local`:
```
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
```

For production, use a Postgres connection string:
```
DATABASE_URL="postgresql://user:password@host:5432/plinko"
```

## Architecture Overview

### Core Components

**Frontend (Next.js 14 + React + TypeScript)**
- `/app/page.tsx` - Main game UI with controls and animations
- `/app/verify/page.tsx` - Verifier page for fairness audits
- Canvas-based animations for ball drop simulation

**Backend (Next.js API Routes)**
- `POST /api/rounds/commit` - Create round with commit hash
- `POST /api/rounds/:id/start` - Start game, compute outcome
- `POST /api/rounds/:id/reveal` - Reveal server seed
- `GET /api/rounds/:id` - Fetch round details
- `GET /api/verify` - Verify round without storing

**Database (Prisma + SQLite/Postgres)**
- `Round` model stores all game state and fairness data

**Fairness Engine**
- `/lib/crypto.ts` - SHA256, Xorshift32 PRNG, seed combining
- `/lib/engine.ts` - Deterministic peg map generation, ball drop simulation

## Fairness Specification

### Commit-Reveal Protocol

1. **Commit Phase**: Server generates random `serverSeed` and `nonce`, publishes `commitHex = SHA256(serverSeed:nonce)`
2. **Client Contribution**: Player provides `clientSeed` (any string)
3. **Reveal Phase**: Server reveals `serverSeed`
4. **Verification**: `combinedSeed = SHA256(serverSeed:clientSeed:nonce)` drives all randomness

### Deterministic Engine

**PRNG**: Xorshift32 seeded from first 4 bytes of `combinedSeed` (big-endian)

**Peg Map Generation**:
- 12 rows, row r has r+1 pegs
- Each peg has `leftBias = 0.5 + (rand() - 0.5) * 0.2` → rounded to 6 decimals
- `pegMapHash = SHA256(JSON.stringify(pegMap))`

**Ball Drop**:
- Maintain position counter `pos` (0-12)
- For each row r:
  - Get peg at index `min(pos, r)`
  - Apply drop column adjustment: `adj = (dropColumn - 6) * 0.01`
  - Adjusted bias: `clamp(leftBias + adj, 0, 1)`
  - Draw `rnd = rand()`
  - If `rnd < adjustedBias`: go Left, else Right (`pos += 1`)
- Final `binIndex = pos`

**Rounding**: All biases rounded to 6 decimals for stable hashing

### Payout Table (Symmetric)

```
Bin:       0     1     2     3     4     5     6     7     8     9    10    11    12
Multiplier: 2.0  1.5  1.2  1.0  0.8  0.5  0.3  0.5  0.8  1.0  1.2  1.5  2.0
```

## Test Vectors

Reference implementation uses:
- **Rows**: 12
- **Server Seed**: `b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc`
- **Nonce**: `42`
- **Client Seed**: `candidate-hello`

**Expected Results**:
- **Commit Hash**: `bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34`
- **Combined Seed**: `e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0`
- **PRNG Sequence** (first 5): `0.1106166649, 0.7625129214, 0.0439292176, 0.4578678815, 0.3438999297`
- **Peg Map** (first rows):
  - Row 0: `[0.422123]`
  - Row 1: `[0.552503, 0.408786]`
  - Row 2: `[0.491574, 0.468780, 0.436540]`
- **Bin Index** (center drop): `6`

Run tests:
```bash
npm test
```

## API Endpoints

### POST /api/rounds/commit
Creates a new round with a server-generated commit.

**Response**:
```json
{
  "roundId": "cuid-string",
  "commitHex": "hex-string",
  "nonce": "hex-string"
}
```

### POST /api/rounds/:id/start
Starts the game and computes the outcome.

**Request**:
```json
{
  "clientSeed": "any-string",
  "betCents": 10000,
  "dropColumn": 6
}
```

**Response**:
```json
{
  "roundId": "cuid-string",
  "pegMapHash": "hex-string",
  "rows": 12,
  "binIndex": 6,
  "payoutMultiplier": 0.3
}
```

### POST /api/rounds/:id/reveal
Reveals the server seed and moves round to REVEALED status.

**Response**:
```json
{
  "roundId": "cuid-string",
  "serverSeed": "hex-string",
  "status": "REVEALED"
}
```

### GET /api/rounds/:id
Fetches full round details.

**Response**: Full Round object with all fields

### GET /api/verify?serverSeed=...&clientSeed=...&nonce=...&dropColumn=...
Verifies a round without storing it.

**Response**:
```json
{
  "commitHex": "hex-string",
  "combinedSeed": "hex-string",
  "pegMapHash": "hex-string",
  "binIndex": 6
}
```

## UI/UX Features

- **Responsive Design**: Mobile and desktop optimized
- **Keyboard Controls**: Arrow keys to select column, Space to drop
- **Accessibility**: Honors `prefers-reduced-motion`, ARIA labels
- **Animations**: Smooth ball drop with peg collisions
- **Sound**: Mute toggle (placeholder for Web Audio API)
- **Verifier Page**: Public page to audit fairness

## File Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main game
│   ├── page.module.css         # Game styles
│   ├── globals.css             # Global styles
│   ├── verify/
│   │   ├── page.tsx            # Verifier page
│   │   └── verify.module.css   # Verifier styles
│   └── api/
│       ├── rounds/
│       │   ├── commit/route.ts
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   ├── start/route.ts
│       │   │   └── reveal/route.ts
│       └── verify/route.ts
├── lib/
│   ├── crypto.ts               # SHA256, Xorshift32, seed combining
│   └── engine.ts               # Peg map, ball drop, payout logic
├── prisma/
│   └── schema.prisma           # Database schema
├── __tests__/
│   ├── crypto.test.ts          # PRNG & combiner tests
│   └── engine.test.ts          # Engine & determinism tests
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## AI Usage & Implementation Notes

### What AI Was Used For
- API route structure and patterns


## License

MIT - Educational project for Daphnis Labs


