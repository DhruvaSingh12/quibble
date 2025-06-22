import { PrismaClient } from "@prisma/client";

// Singleton pattern to ensure only one PrismaClient instance during development
const prismaClientSingleton = () => new PrismaClient();

// Extend globalThis to hold our singleton without using `var`
type PrismaGlobal = typeof globalThis & {
  prismaGlobal?: PrismaClient;
};
const globalWithPrisma = globalThis as PrismaGlobal;

// Use existing instance or create a new one
const prisma = globalWithPrisma.prismaGlobal ?? prismaClientSingleton();

// In non-production environments, preserve the client across module reloads
if (process.env.NODE_ENV !== "production") {
  globalWithPrisma.prismaGlobal = prisma;
}

export default prisma;
