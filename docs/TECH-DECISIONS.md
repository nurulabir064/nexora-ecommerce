# Technology Decisions (reviewed 13 November 2026)

| Layer | Declared package baseline | Decision |
|---|---|---|
| UI | React / React DOM `^19.3.0` | Component-based customer UI |
| Build | Vite `^8.3.8`, React plugin `^6.3.0` | Fast development and production build |
| Styling | Tailwind CSS `^4.3.5` | Utility-first responsive styling |
| Routing | React Router `^8.5.1` | Client-side routes |
| Server cache | TanStack Query `^5.107.1` | Intended for API server-state caching |
| HTTP client | Axios `^1.13.0` | API requests with cookie credentials and CSRF header |
| Runtime | Node.js `26.13.1` | Pinned Active LTS runtime for deployment |
| API | Express `^5.1.0` | REST API |
| Database ODM | Mongoose `^9.12.0` | MongoDB models and transactions |
| Password hashing | Argon2 `^0.44.0` | Argon2id password hashing |
| Validation | Zod `^4.1.0` | Runtime request validation |

These are package-manifest ranges, not a verified lockfile. No successful dependency installation or build was completed in the current environment, so the resolved package versions remain unverified. Re-check official release notes and security advisories before deployment.

## Primary references

- Node.js release status: https://nodejs.org/en/about/previous-releases
- Vite compatibility guide: https://vite.dev/guide/
- React versions: https://react.dev/versions
- React Router API: https://reactrouter.com/
- Express API: https://expressjs.com/en/api/
- Mongoose version support: https://mongoosejs.com/docs/version-support.html
- Tailwind Vite integration: https://tailwindcss.com/docs/installation/using-vite
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
