# Setup Instructions

**Deploy locally in under 5 minutes (Clone → Install → Run):**

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Assignly/my-app
   ```

2. **Set up Environment Variables**
   Create a `.env.local` file inside the `my-app` directory. This single file powers both your React frontend (`VITE_` keys) and the local Express backend (Admin SDK keys). Fill in your Firebase credentials:

   ```env
   # --- Frontend Firebase Config (Client SDK) ---
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"

   # --- Backend Firebase Config (Admin SDK) ---
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="your-service-account-email"
   FIREBASE_PRIVATE_KEY="your-private-key-string-with-\n"
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Run the Application**
   ```bash
   npm run dev
   ```
   _Your application will boot up at `http://localhost:5173`._

## Assumptions and Trade-offs

1. **Serverless Infrastructure Latency:** Assignly's Express backbone is deployed to Vercel Serverless Functions. _Trade-off:_ We exchanged guaranteed sub-millisecond API response times (which a dedicated 24/7 server provides) for infinite, zero-maintenance scalability. This exposes users to occasional "cold starts" during prolonged inactivity.
2. **Client-Side Firebase Auth:** We completely delegated password/OAuth generation and hashing to the Firebase Client SDK directly in the browser instead of writing custom backend OAuth pipes. _Trade-off:_ We lose fine-grained control over session storage configurations, but we secure enterprise-grade cryptography immediately. The backend simply verifies the cryptographic signatures of the JWTs.
3. **NoSQL Denormalization:** By utilizing Firestore, we assumed read requests (frequent dashboard loads) will exponentially outnumber write requests (task creations). _Trade-off:_ We traded the absolute relational integrity of SQL (`JOIN` tables for permissions/assignments) for the raw vertical read speed of NoSQL documents.
4. **Soft-Delete Masking:** Realizing that a delegated task needs dual-visibility (if an assignee "deletes" a task, the delegator should still see it), we avoided building generic many-to-many permission tables. _Trade-off:_ We explicitly check assignment statuses manually inside the Node Express `DELETE` endpoint and convert the query into a soft `update({ deletedByAssignee: true })` mask if necessary, preferring rapid inline hacks over rigidly structured foreign constraint models.

---

## Architecture

Assignly utilizes a modern, serverless monorepo architecture engineered for high performance and zero-config cloud deployments.

```mermaid
graph TD
    Client[React Frontend (Vite + Tailwind)]
    Auth[Firebase Authentication]
    API[Vercel Serverless API (Express)]
    DB[(Firebase Firestore)]

    Client <-->|1. OAuth Login| Auth
    Auth -->|2. Returns JWT Token| Client
    Client <-->|3. HTTPS REST + Bearer Token| API
    API <-->|4. Firebase Admin SDK | DB
```

### Core Technologies

- **Frontend (Client):** React 18 powered by Vite. Styling is handled entirely via TailwindCSS for responsive, utility-first design. Routing is managed exclusively via React Router.
- **Backend (API):** A custom Node.js Express server running fully stateless on Vercel Serverless Functions (`api/index.js`).
- **Database:** Firebase Firestore (NoSQL Document Store) accessed natively through the Google Firebase Admin SDK within the Express routes.
- **Authentication:** Google OAuth natively handled by the Firebase Client SDK on the frontend. The resulting JWT tokens are securely passed as HTTP Bearer headers to the Express backend, which mathematically verifies them via the Admin SDK before mutating database states.

Known limitation and future improvements

AI Tools

Link to Live Demo
https://worksync-self.vercel.app/
