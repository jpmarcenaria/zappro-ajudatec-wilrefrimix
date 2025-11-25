# Core Files - ZapPRO Project

This document identifies the 15-20 most critical files in the ZapPRO codebase, their purpose, and key dependencies.

## Priority 1: Application Core (5 files)

### 1. [`apps/saas/app/layout.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/app/layout.tsx)
**Purpose**: Root layout component, wraps entire application  
**Key Features**:
- Provides `AuthProvider` context to all pages
- Sets up global metadata and fonts
- Imports global CSS

**Dependencies**: `contexts/AuthContext.tsx`, `globals.css`

---

### 2. [`apps/saas/contexts/AuthContext.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/contexts/AuthContext.tsx)
**Purpose**: Authentication state management  
**Key Features**:
- Manages user session (login, logout, signup)
- Integrates with Supabase Auth
- Provides `useAuth()` hook for components

**Dependencies**: `lib/supabase.ts`, `@supabase/supabase-js`

---

### 3. [`apps/saas/app/page.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/app/page.tsx)
**Purpose**: Landing page (homepage)  
**Key Features**:
- Displays `WebLanding` component
- Stripe pricing table integration

**Dependencies**: `components/WebLanding.tsx`

---

### 4. [`apps/saas/middleware.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/middleware.ts)
**Purpose**: Route protection and security headers  
**Key Features**:
- CORS configuration
- Security headers (CSP, X-Frame-Options, etc.)
- Applies to all `/api/*` routes

**Dependencies**: None (Next.js core)

---

### 5. [`apps/saas/lib/supabase.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/lib/supabaseClient.ts)
**Purpose**: Supabase client initialization  
**Key Features**:
- Creates Supabase client with env vars
- Used by all database operations

**Dependencies**: `@supabase/supabase-js`

---

## Priority 2: AI & Chat (3 files)

### 6. [`apps/saas/app/api/openai/chat/route.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/app/api/openai/chat/route.ts)
**Purpose**: Chatbot API endpoint (OpenAI integration)  
**Key Features**:
- Handles chat requests with text/attachments
- Integrates web search (Tavily, Brave, Firecrawl)
- Implements persona system prompt
- Returns grounding URLs

**Dependencies**: `lib/monitor.ts`, OpenAI API

---

### 7. [`apps/saas/lib/aiService.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/lib/aiService.ts)
**Purpose**: AI service orchestration  
**Key Features**:
- `sendMessage()`: Calls `/api/openai/chat`
- `generateSpeech()`: TTS integration
- `transcribeAudio()`: STT integration

**Dependencies**: `/api/openai/chat`, `/api/openai/speech`, `/api/openai/transcribe`

---

### 8. [`apps/saas/components/ChatInterface.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/components/ChatInterface.tsx)
**Purpose**: Chat UI component (WhatsApp-style)  
**Key Features**:
- Message display with formatting
- Audio recording and playback
- File attachments (images, PDFs, videos)
- Quick action chips

**Dependencies**: `lib/aiService.ts`, `types.ts`

---

## Priority 3: UI Components (3 files)

### 9. [`apps/saas/components/WebLanding.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/components/WebLanding.tsx)
**Purpose**: Landing page UI  
**Key Features**:
- Hero section with iPhone mockup
- Feature grid
- Pricing display
- Auth modal integration

**Dependencies**: `components/auth/AuthModal.tsx`, `contexts/AuthContext.tsx`

---

### 10. [`apps/saas/components/auth/AuthModal.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/components/auth/AuthModal.tsx)
**Purpose**: Login/Register modal  
**Key Features**:
- Toggles between login and register modes
- OAuth buttons (Google, GitHub)
- Form validation

**Dependencies**: `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`

---

### 11. [`apps/saas/app/dashboard/page.tsx`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/app/dashboard/page.tsx)
**Purpose**: User dashboard  
**Key Features**:
- Displays subscription status
- Quick actions (Start Chat, Manuals, Settings)
- Protected route (requires auth)

**Dependencies**: `contexts/AuthContext.tsx`

---

## Priority 4: Payment & Webhooks (2 files)

### 12. [`apps/saas/app/api/webhook/stripe/route.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/app/api/webhook/stripe/route.ts)
**Purpose**: Stripe webhook handler  
**Key Features**:
- Validates webhook signatures
- Processes subscription events
- Updates Supabase `subscriptions` table

**Dependencies**: `stripe`, `@supabase/supabase-js`

---

### 13. [`apps/saas/app/api/webhook/stripe/test/route.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/app/api/webhook/stripe/test/route.ts)
**Purpose**: Mock Stripe webhook (dev/testing)  
**Key Features**:
- Simulates Stripe events without real webhooks
- Disabled in production by default
- Useful for local testing

**Dependencies**: `@supabase/supabase-js`

---

## Priority 5: Database & Config (5 files)

### 14. [`supabase/migrations/0001_init.sql`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/supabase/migrations/0001_init.sql)
**Purpose**: Database schema initialization  
**Key Features**:
- Creates tables: `profiles`, `subscriptions`, `monitor_route_metrics`, `monitor_logs`
- Sets up RLS policies
- Creates triggers for plan updates

**Dependencies**: None (SQL)

---

### 15. [`supabase/migrations/0002_restrict_logs.sql`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/supabase/migrations/0002_restrict_logs.sql)
**Purpose**: Security fix for logs  
**Key Features**:
- Removes public SELECT policies on `monitor_logs`
- Restricts access to service role only

**Dependencies**: `0001_init.sql`

---

### 16. [`apps/saas/package.json`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/package.json)
**Purpose**: Dependencies and scripts  
**Key Features**:
- Lists all npm packages
- Defines build/dev/test scripts

**Dependencies**: None (npm)

---

### 17. [`apps/saas/next.config.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/next.config.ts)
**Purpose**: Next.js configuration  
**Key Features**:
- Build settings
- Image optimization config
- Environment variable handling

**Dependencies**: None (Next.js)

---

### 18. [`apps/saas/.env`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/.env)
**Purpose**: Environment variables (secrets)  
**Key Features**:
- API keys (OpenAI, Stripe, Supabase, Tavily, Brave, Firecrawl)
- Database URLs
- OAuth credentials

**⚠️ CRITICAL**: Must be in `.gitignore`, never commit to repo

---

## Supporting Files

### 19. [`apps/saas/types.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/types.ts)
**Purpose**: TypeScript type definitions  
**Key Features**:
- `Message`, `Attachment`, `User`, `UserPlan` types

---

### 20. [`apps/saas/constants.ts`](file:///d:/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas/constants.ts)
**Purpose**: Application constants  
**Key Features**:
- `PLAN_PRICE`, `AUTHOR_HANDLE`

---

## Dependency Flow Diagram

```mermaid
graph TD
    A[layout.tsx] --> B[AuthContext.tsx]
    B --> C[supabase.ts]
    
    D[page.tsx] --> E[WebLanding.tsx]
    E --> F[AuthModal.tsx]
    F --> B
    
    G[dashboard/page.tsx] --> B
    G --> H[/chat]
    
    H --> I[ChatInterface.tsx]
    I --> J[aiService.ts]
    J --> K[/api/openai/chat]
    
    K --> L[OpenAI API]
    K --> M[Tavily/Brave/Firecrawl]
    
    N[/api/webhook/stripe] --> C
    O[/api/webhook/stripe/test] --> C
    
    P[0001_init.sql] --> Q[Supabase DB]
    R[0002_restrict_logs.sql] --> Q
    
    C --> Q
```

---

## Notes

- **Hot Reload**: Changes to API routes may require server restart
- **Environment**: `.env` must be configured for all features to work
- **Database**: Run migrations with `npx supabase db push`
- **Testing**: E2E tests in `apps/saas/tests/` cover critical flows
