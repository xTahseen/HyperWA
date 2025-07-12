
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");
const tar = require("tar");
const { connectDb } = require("./db"); // Assuming './db' correctly connects to your MongoDB

const AUTH_DIR = "./auth_info";
const AUTH_TAR = "auth_info.tar";

async function useMongoAuthState() {
    const db = await connectDb();
    const coll = db.collection("auth");

    // Ensure the AUTH_DIR exists to prevent issues with useMultiFileAuthState
    // especially if it's the first run and no session exists in DB.
    await fs.ensureDir(AUTH_DIR);

    // Clean up any previous data before attempting to restore or create
    // This is crucial for a clean slate on each startup.
    try {
        await fs.remove(AUTH_DIR);
        await fs.remove(AUTH_TAR);
        console.log("🧹 Cleaned up previous auth data.");
    } catch (err) {
        console.error("❌ Error during initial cleanup:", err);
        // Continue even if cleanup fails, as the next steps might overwrite anyway.
    }

    let sessionRestored = false;
    const session = await coll.findOne({ _id: "session" });

    // Step 1: Restore session from MongoDB archive if available
    if (session && session.archive) {
        try {
            const tarBuffer = session.archive.buffer || session.archive; // Handle potential differences in buffer storage
            if (!tarBuffer || tarBuffer.length === 0) {
                throw new Error("Empty or invalid archive buffer from database.");
            }

            await fs.writeFile(AUTH_TAR, tarBuffer);

            // Create the directory if it doesn't exist before extraction
            await fs.ensureDir(AUTH_DIR);

            // Extract the tarball into the AUTH_DIR
            await tar.x({ file: AUTH_TAR, C: AUTH_DIR }); // Extract directly into AUTH_DIR

            const credsPath = path.join(AUTH_DIR, "creds.json");
            const credsExists = await fs.pathExists(credsPath);

            if (!credsExists) {
                console.warn("⚠️ creds.json missing in archive. Session may be corrupted. Deleting session from DB.");
                await coll.deleteOne({ _id: "session" });
                await fs.remove(AUTH_DIR); // Clean up partially extracted data
                sessionRestored = false; // Mark as not restored, so a new session is created
            } else {
                console.log("✅ Session restored from DB.");
                sessionRestored = true;
            }
        } catch (err) {
            console.error("❌ Failed to extract or restore session from DB:", err);
            await coll.deleteOne({ _id: "session" }); // Invalidate corrupted session
            await fs.remove(AUTH_DIR); // Ensure no partial data remains
            sessionRestored = false;
        } finally {
            // Always clean up the temporary tar file
            await fs.remove(AUTH_TAR);
        }
    } else {
        console.log("ℹ️ No existing session found or archive is empty. A new QR code will be shown.");
        // Ensure AUTH_DIR is empty if no session was found or restored
        await fs.remove(AUTH_DIR);
        await fs.ensureDir(AUTH_DIR);
    }

    // Step 2: Create auth state using the (possibly restored) AUTH_DIR
    // If sessionRestored is false, useMultiFileAuthState will create new files.
    // If true, it will load existing ones.
    const { state, saveCreds: originalSaveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Step 3: Custom saveCreds with DB update
    // This function will be called by Baileys whenever credentials change.
    async function saveCreds() {
        console.log("🔄 Saving credentials...");
        try {
            // First, let Baileys update its files on disk
            await originalSaveCreds();
            console.log("✅ Baileys credentials saved to disk.");

            // Now, create the tar archive from the updated directory
            // Ensure you're archiving the *contents* of AUTH_DIR, not the directory itself if it's the cwd
            // We use 'C: AUTH_DIR' and specify '.' to archive all contents within AUTH_DIR
            // and then move it to the root where AUTH_TAR is expected.
            const tempTarPath = path.join(AUTH_DIR, "temp_auth_info.tar");
            await tar.c(
                {
                    file: tempTarPath,
                    cwd: AUTH_DIR, // 
                    portable: true // For cross-platform consistency
                },
                ["."] // Archive everything in the current working directory (which is AUTH_DIR)
            );

            // Read the newly created tar file
            const data = await fs.readFile(tempTarPath);

            // Update MongoDB
            await coll.updateOne(
                { _id: "session" },
                { $set: { archive: data } },
                { upsert: true } // Create if not exists
            );
            console.log("💾 Session archive updated in MongoDB.");

            // Clean up the temporary tar file
            await fs.remove(tempTarPath);
        } catch (err) {
            console.error("❌ Error saving credentials to DB:", err);
            // Consider adding a retry mechanism or more aggressive logging here
        }
    }

    return { state, saveCreds };
}

module.exports = { useMongoAuthState };
