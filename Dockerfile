FROM node:22-alpine

WORKDIR /app

ENV PNPM_HOME=/usr/local/share/pnpm
ENV PNPM_STORE_DIR=/tmp/pnpm-store
ENV PNPM_CONFIG_PACKAGE_IMPORT_METHOD=copy
ENV PATH=$PNPM_HOME:$PATH

RUN npm install -g pnpm@10.24.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile --store-dir=${PNPM_STORE_DIR} --package-import-method=copy

COPY server ./server

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1116
ENV PLANTSCNET_DATA_DIR=/app/data
ENV PLANTSCNET_SPECIES_META_DIR=/app/species_meta_data
ENV PLANTSCNET_FEATHER_DIR=/app/feather_file
ENV PLANTSCNET_MEME_DIR=/app/meme_file
ENV PLANTSCNET_TF_LIST_DIR=/app/tf_list
ENV PLANTSCNET_FINAL_REGULATORY_DIR=/app/final_regulatory_file

EXPOSE 1116

CMD ["node", "server/index.js"]
