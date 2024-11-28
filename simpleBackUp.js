// backup-all-collections.js
const { MongoClient } = require("mongodb");
const fs = require("fs");

const uri = "mongodb+srv://user:password@something.example.mongodb.net/db_name";

const client = new MongoClient(uri, { useUnifiedTopology: true });

// https://nesin.io/blog/convert-date-to-yyyy-mm-dd-javascript
const convertDate = (dt) => {
  const year = dt.getFullYear();
  const month = (dt.getMonth() + 1).toString().padStart(2, "0");
  const date = dt.getDate();
  return `${year}-${month}-${date}`;
};

async function exportAllCollections() {
  try {
    const fileName = `${convertDate(new Date())}.json`;
    await client.connect();
    const db = client.db();
    // This will fetch all the collection names from the database so you don't have to manually keep track of it.
    const collections = await db.listCollections().toArray();
    const data = {};

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const documents = await collection.find().toArray();
      data[collectionName] = documents;
    }
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error exporting collections:", error);
  } finally {
    await client.close();
  }
}

exportAllCollections();
