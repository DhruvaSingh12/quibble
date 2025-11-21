import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Singleton pattern to ensure only one PrismaClient instance during development
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  // Use pg Pool for better compatibility
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
};

// Extend globalThis to hold our singleton without using `var`
type PrismaGlobal = typeof globalThis & {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
};
const globalWithPrisma = globalThis as PrismaGlobal;

// Use existing instance or create a new one
const prisma = globalWithPrisma.prismaGlobal ?? prismaClientSingleton();

// In non-production environments, preserve the client across module reloads
if (process.env.NODE_ENV !== "production") {
  globalWithPrisma.prismaGlobal = prisma;
}

export default prisma;