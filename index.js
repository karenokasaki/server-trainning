import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

const registerModels = async () => {
   try {
      const collections = await mongoose.connection.db
         .listCollections()
         .toArray();
      const collectionNames = collections.map((collection) => collection.name);

      collectionNames.forEach((collectionName) => {
         if (!mongoose.models[collectionName]) {
            // Cria um novo modelo
            mongoose.model(
               collectionName,
               mongoose.Schema({}, { strict: false }),
               collectionName
            );
         }
      });
   } catch (err) {
      console.error("Erro ao registrar os modelos:", err);
   }
};

async function connectDB() {
   // Conexão com o MongoDB usando o Mongoose
   try {
      mongoose
         .connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
         })
         .then(() => {
            registerModels();
            console.log("Conexão com o MongoDB estabelecida com sucesso");
         })
         .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));
   } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: error });
   }
}

app.post("/:aluno", async (req, res) => {
   try {
      const aluno = req.params.aluno;
      const collections = await mongoose.connection.db
         .listCollections()
         .toArray();
      const collectionExists = collections.some(
         (collection) => collection.name === aluno
      );

      if (!collectionExists) {
         // Cria a coleção se não existir
         await mongoose.connection.db.createCollection(aluno);
      }

      let AlunoModel;
      if (mongoose.models[aluno]) {
         // O modelo já foi compilado, reutiliza o modelo existente
         AlunoModel = mongoose.model(aluno);
      } else {
         // Cria um novo modelo
         AlunoModel = mongoose.model(
            aluno,
            mongoose.Schema({}, { strict: false }),
            aluno
         );
      }
      const document = new AlunoModel({ ...req.body }); // Supondo que o documento seja enviado no corpo da requisição

      document.save((err, savedDocument) => {
         if (err) {
            res.status(500).send("Erro ao inserir o documento");
         } else {
            res.status(200).send("Documento inserido com sucesso");
         }
      });
   } catch (err) {
      console.error("Erro na rota POST:", err);
      res.status(500).send("Erro interno do servidor");
   }
});

// Rota GET para obter todos os documentos de uma coleção
app.get("/:aluno", async (req, res) => {
   try {
      const aluno = req.params.aluno;
      const AlunoModel = mongoose.model(aluno);

      AlunoModel.find({}, (err, documents) => {
         if (err) {
            res.status(500).send("Erro ao obter os documentos");
         } else {
            res.status(200).json(documents);
         }
      });
   } catch (err) {
      console.error("Erro na rota GET:", err);
      res.status(500).send("Erro interno do servidor");
   }
});

// Rota GET para obter dados de um documento específico
app.get("/:aluno/:id", async (req, res) => {
   try {
      const aluno = req.params.aluno;
      const id = req.params.id;
      const AlunoModel = mongoose.model(aluno);

      AlunoModel.findById(id, (err, document) => {
         if (err) {
            res.status(500).send("Erro ao obter o documento");
         } else {
            if (document) {
               res.status(200).json(document);
            } else {
               res.status(404).send("Documento não encontrado");
            }
         }
      });
   } catch (err) {
      console.error("Erro na rota GET:", err);
      res.status(500).send("Erro interno do servidor");
   }
});

// Rota PUT para editar um documento pelo ID
app.put("/:aluno/:id", async (req, res) => {
   try {
      const aluno = req.params.aluno;
      const id = req.params.id;
      const AlunoModel = mongoose.model(aluno);

      AlunoModel.findByIdAndUpdate(
         id,
         { $set: { ...req.body } },
         { new: true },
         (err, updatedDocument) => {
            if (err) {
               res.status(500).send("Erro ao atualizar o documento");
            } else {
               res.status(200).json(updatedDocument);
            }
         }
      );
   } catch (err) {
      console.error("Erro na rota PUT:", err);
      res.status(500).send("Erro interno do servidor");
   }
});

// Rota DELETE para excluir um documento da coleção
app.delete("/:aluno/:id", async (req, res) => {
   try {
      const aluno = req.params.aluno;
      const id = req.params.id;
      const AlunoModel = mongoose.model(aluno);

      AlunoModel.findByIdAndDelete(id, (err, deletedDocument) => {
         if (err) {
            res.status(500).send("Erro ao excluir o documento");
         } else {
            res.status(200).send("Documento excluído com sucesso");
         }
      });
   } catch (err) {
      console.error("Erro na rota DELETE:", err);
      res.status(500).send("Erro interno do servidor");
   }
});

// Rota DELETE para excluir completamente a coleção
app.delete("/:aluno", async (req, res) => {
   try {
      const aluno = req.params.aluno;

      mongoose.connection.db.dropCollection(aluno, (err, result) => {
         if (err) {
            res.status(500).send("Erro ao excluir a coleção");
         } else {
            res.status(200).send("Coleção excluída com sucesso");
         }
      });
   } catch (err) {
      console.error("Erro na rota DELETE:", err);
      res.status(500).send("Erro interno do servidor");
   }
});

connectDB().then(() => {
   app.listen(Number(process.env.PORT), () => {
      console.log(`Server up and running at port ${process.env.PORT}`);
   });
});
