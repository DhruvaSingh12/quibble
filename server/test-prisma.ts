import { prisma } from "./src/config/prisma";
async function main() {
    try {
        await prisma.chatMessage.updateMany({
            where: { id: "test" },
            data: { deletedFor: { push: "test_user" } }
        });
        console.log("Success");
    } catch(e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
