const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");
const tar = require("tar");
const { connectDb } = require("./db");

const AUTH_DIR = "./auth_info";
const AUTH_TAR = "auth_info.tar";

async function useMongoAuthState() {
    const db = await connectDb();
    const coll = db.collection("auth");

    // Step 1: Cleanup previous data
    await fs.remove(AUTH_DIR);
    await fs.remove(AUTH_TAR);

    // Step 2: Restore session from DB if it exists
    const session = await coll.findOne({ _id: "session" });
    const archiveBuffer = session?.archive?.buffer || session?.archive;

    if (archiveBuffer && Buffer.isBuffer(archiveBuffer)) {
        try {
            await fs.writeFile(AUTH_TAR, archiveBuffer);
            await tar.x({ file: AUTH_TAR, C: ".", strict: true });

            const credsPath = path.join(AUTH_DIR, "creds.json");
            const credsExists = await fs.pathExists(credsPath);

            if (credsExists) {
                console.log("✅ Session restored successfully from MongoDB.");
            } else {
                console.warn("⚠️ Session archive extracted but creds.json missing. Deleting session.");
                await coll.deleteOne({ _id: "session" });
                await fs.remove(AUTH_DIR);
            }
        } catch (err) {
            console.error("❌ Failed to restore session from MongoDB:", err);
            await coll.deleteOne({ _id: "session" });
            await fs.remove(AUTH_DIR);
        } finally {
            await fs.remove(AUTH_TAR);
        }
    } else {
        console.log("ℹ️ No existing session found. A new QR code will be generated.");
    }

    // Step 3: Generate multi-file auth state
    const { state, saveCreds: originalSaveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Step 4: Save auth state back to MongoDB
    async function saveCreds() {
        await originalSaveCreds();
        await tar.c({ file: AUTH_TAR, cwd: ".", portable: true }, ["auth_info"]);
        const data = await fs.readFile(AUTH_TAR);

        await coll.updateOne(
            { _id: "session" },
            { $set: { archive: data } },
            { upsert: true }
        );

        await fs.remove(AUTH_TAR);
    }

    return { state, saveCreds };
}

module.exports = { useMongoAuthState };
