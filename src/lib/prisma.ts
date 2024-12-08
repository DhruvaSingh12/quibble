import {PrismaClient} from "@prisma/client";

const prismaClientSingelton = () => {
    return new PrismaClient();
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingelton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingelton();
export default prisma;
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;