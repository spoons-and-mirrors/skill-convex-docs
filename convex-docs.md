---
name: convex-docs
description: Get convex documentation LINKS so you can fetch them as markdown
metadata:
  updated: 2026-01-21 19:27:01 UTC
---

HOW TO CONSTRUCT URLs:
All pages are markdown - append .md to construct the full URL.

FORMAT 1 - CORE items (no section prefix):
  https://docs.convex.dev/<item>.md
  Example: "realtime" → https://docs.convex.dev/realtime.md

FORMAT 2 - Section with slash /section/:
  https://docs.convex.dev/<section>/<item>.md
  Example: DATABASE /database/ + "schemas" → https://docs.convex.dev/database/schemas.md
  Example: DATABASE /database/ + "advanced/occ" → https://docs.convex.dev/database/advanced/occ.md
  Items with slashes are FULL subpaths - do NOT drop any part!

FORMAT 3 - Section with dot prefix /section/prefix.:
  https://docs.convex.dev/<section>/<prefix>.<item>.md
  Example: API CLASSES VALUES /api/classes/values. + "VString" → https://docs.convex.dev/api/classes/values.VString.md
  Example: API INTERFACES SERVER /api/interfaces/server. + "Auth" → https://docs.convex.dev/api/interfaces/server.Auth.md

<convex-docs-list>

CORE https://docs.convex.dev/
realtime, chef, deployment-platform-api, error, eslint, http-api, self-hosting, streaming-export-api
streaming-import-api

QUICKSTART /quickstart/
android, bun, nextjs, nodejs, nuxt, python, react, react-native, remix, rust, script-tag, svelte
swift, tanstack-start, vue

TUTORIAL /tutorial/
actions, scale

UNDERSTANDING /understanding/
best-practices, workflow, zen, best-practices/other-recommendations, best-practices/typescript

FUNCTIONS /functions/
actions, bundling, debugging, error-handling, http-actions, internal-functions, mutation-functions
query-functions, runtimes, validation, error-handling/application-errors

DATABASE /database/
backup-restore, document-ids, import-export, pagination, reading-data, schemas, types, writing-data
advanced/occ, import-export/export, reading-data/filters, advanced/schema-philosophy
advanced/system-tables, import-export/import, reading-data/indexes
reading-data/indexes/indexes-and-query-perf

AUTH /auth/
auth0, authkit, clerk, convex-auth, database-auth, debug, functions-auth, advanced/custom-auth
authkit/auto-provision, advanced/custom-jwt, authkit/troubleshooting

FILE STORAGE /file-storage/
delete-files, file-metadata, serve-files, store-files, upload-files

SCHEDULING /scheduling/
cron-jobs, scheduled-functions

SEARCH /search/
text-search, vector-search

CLIENTS /client/
android, javascript, open-api, python, react, react-native, rust, svelte, swift, vue
android/data-types, javascript/bun, nextjs/app-router, react/deployment-urls, swift/data-types
tanstack/tanstack-query, vue/nuxt, javascript/node, javascript/script-tag
nextjs/app-router/server-rendering, nextjs/pages-router, nextjs/pages-router/quickstart
react/optimistic-updates, tanstack/tanstack-start, tanstack/tanstack-start/clerk

AGENTS /agents/
agent-usage, context, debugging, files, getting-started, human-agents, messages, playground, rag
rate-limiting, streaming, threads, tools, usage-tracking, workflows

AI /ai/
convex-mcp-server, using-cursor, using-github-copilot, using-windsurf

COMPONENTS /components/
authoring, understanding, using

TESTING /testing/
ci, convex-backend, convex-test

PRODUCTION /production/
contact, environment-variables, hosting, integrations, multiple-repos, pause-deployment
project-configuration, state, hosting/custom, integrations/exception-reporting, state/limits
hosting/netlify, hosting/preview-deployments, hosting/vercel, integrations/log-streams
integrations/log-streams/legacy-event-schema, integrations/streaming-import-export

CLI /cli/
agent-mode, deploy-key-types, local-deployments

DASHBOARD /dashboard/
deployments, projects, teams, deployments/data, deployments/deployment-settings
deployments/file-storage, deployments/functions, deployments/health, deployments/history
deployments/logs, deployments/schedules

GENERATED API /generated-api/
api, data-model, server

MANAGEMENT API /management-api/
convex-management-api, create-custom-domain, create-deploy-key, create-project, delete-custom-domain
delete-deployment, delete-project, get-token-details, list-custom-domains, list-deployments
list-projects

DEPLOYMENT API /deployment-api/
convex-deployment-api, create-log-stream, delete-log-stream, get-canonical-urls, get-log-stream
list-environment-variables, list-log-streams, pause-deployment, rotate-webhook-secret
unpause-deployment, update-canonical-url, update-environment-variables, update-log-stream

PUBLIC API /public-deployment-api/
convex-public-http-routes, public-action-post, public-function-post, public-function-post-with-path
public-get-query-ts, public-mutation-post, public-query-at-ts-post, public-query-batch-post
public-query-get, public-query-post

API REF /api/
modules, modules/browser, modules/nextjs, modules/react, modules/react_auth0, modules/react_clerk
modules/server, modules/values

API CLASSES BROWSER /api/classes/browser.
BaseConvexClient, ConvexClient, ConvexHttpClient

API CLASSES REACT /api/classes/react.
ConvexReactClient

API CLASSES SERVER /api/classes/server.
Crons, Expression, FilterExpression, HttpRouter, IndexRange, SchemaDefinition, SearchFilter
TableDefinition

API CLASSES VALUES /api/classes/values.
ConvexError, VAny, VArray, VBoolean, VBytes, VFloat64, VId, VInt64, VLiteral, VNull, VObject
VRecord, VString, VUnion

API INTERFACES BROWSER /api/interfaces/browser.
BaseConvexClientOptions, MutationOptions, OptimisticLocalStore, SubscribeOptions

API INTERFACES REACT /api/interfaces/react.
ConvexReactClientOptions, MutationOptions, ReactAction, ReactMutation, Watch, WatchQueryOptions

API INTERFACES SERVER /api/interfaces/server.
Auth, BaseTableReader, BaseTableWriter, CronJob, DefineSchemaOptions, FilterBuilder
GenericActionCtx, GenericDatabaseReader, GenericDatabaseReaderWithTable, GenericDatabaseWriter
GenericDatabaseWriterWithTable, GenericMutationCtx, GenericQueryCtx, IndexRangeBuilder, OrderedQuery
PaginationOptions, PaginationResult, Query, QueryInitializer, Scheduler, SearchFilterBuilder
SearchFilterFinalizer, SearchIndexConfig, StorageActionWriter, StorageReader, StorageWriter
SystemDataModel, UserIdentity, ValidatedFunction, VectorFilterBuilder, VectorIndexConfig
VectorSearchQuery

API NAMESPACES VALUES /api/namespaces/values.
Base64

PLATFORM APIS /platform-apis/
embedded-dashboard, oauth-applications

</convex-docs-list>
