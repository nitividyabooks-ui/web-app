FROM node:20-alpine AS base

# Install dependencies based on the preferred manifest
WORKDIR /app

# Install dependencies based on the preferred manifest
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/public ./public

# Set the correct permission for the static files
RUN mkdir -p .next/static
RUN chown -R nextjs:nodejs /app/.next
RUN chown -R nextjs:nodejs /app/public
USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["npm", "start"]