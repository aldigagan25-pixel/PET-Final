// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config';

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Gunakan URL yang mengarah ke file database SQLite Anda
    url: "file:./dev.db",
  },
});