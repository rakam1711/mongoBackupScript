const { MongoClient } = require("mongodb");
const fs = require("fs");

const uri = "your database connection";
const client = new MongoClient(uri);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const streamCollectionToFile = async (collection, outputStream) => {
  const cursor = collection.find();
  outputStream.write(`"${collection.collectionName}": [\n`);

  let first = true;
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    if (!first) outputStream.write(",\n");
    outputStream.write(JSON.stringify(document));
    first = false;
  }

  outputStream.write("\n],\n");
};

const exportAllCollections = async () => {
  const fileName = `backup-${formatDate(new Date())}.json`;
  const outputStream = fs.createWriteStream(fileName);
  outputStream.write("{\n");

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully.");

    const dbName = uri.split("/").pop();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collection = db.collection(collectionInfo.name);
      console.log(
        `Streaming collection '${collection.collectionName}' to file...`
      );
      await streamCollectionToFile(collection, outputStream);
    }

    outputStream.write("}\n");
    console.log("Backup completed successfully!");
  } catch (error) {
    console.error("Error during backup:", error.message);
  } finally {
    outputStream.end();
    await client.close();
    console.log("MongoDB connection closed.");
  }
};

// Run the script
const main = async () => {
  console.log("Starting backup...");
  await exportAllCollections();
};

main();
