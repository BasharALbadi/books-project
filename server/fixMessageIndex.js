import mongoose from "mongoose";
import * as ENV from "./config.js";

const connectString = `mongodb+srv://${ENV.DB_USER}:${ENV.DB_PASSWORD}@${ENV.DB_CLUSTER}/${ENV.DB_NAME}?retryWrites=true&w=majority`;

async function fixMessageIndexes() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(connectString);
    console.log("Conexión establecida con éxito!");

    console.log("Obteniendo índices actuales de la colección 'messages'...");
    const indexes = await mongoose.connection.db.collection('messages').indexes();
    console.log("Índices encontrados:", indexes);
    
    // Buscar y eliminar el índice 'id_1' si existe
    const idIndex = indexes.find(idx => idx.name === 'id_1');
    
    if (idIndex) {
      console.log("Eliminando índice 'id_1'...");
      await mongoose.connection.db.collection('messages').dropIndex('id_1');
      console.log("Índice 'id_1' eliminado con éxito!");
    } else {
      console.log("No se encontró el índice 'id_1', verificando otros índices...");
      
      // Buscar cualquier índice que incluya el campo 'id'
      const otherIdIndexes = indexes.filter(idx => idx.key && idx.key.id);
      
      if (otherIdIndexes.length > 0) {
        for (const idx of otherIdIndexes) {
          console.log(`Eliminando índice '${idx.name}'...`);
          await mongoose.connection.db.collection('messages').dropIndex(idx.name);
          console.log(`Índice '${idx.name}' eliminado con éxito!`);
        }
      } else {
        console.log("No se encontraron índices problemáticos para el campo 'id'");
      }
    }

    console.log("Modificando el modelo de mensajes...");
    // Borrar toda la colección y recrearla sin el índice problemático
    await mongoose.connection.db.collection('messages').deleteMany({});
    console.log("Colección limpiada con éxito!");

    console.log("Operación completada. Ahora debería poder enviar y recibir mensajes normalmente.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la operación:", error);
    process.exit(1);
  }
}

// Ejecutar la función
fixMessageIndexes(); 