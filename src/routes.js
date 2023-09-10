import { Database } from './database.js';
import { buildRoutePath } from "./utils/build-route-path.js";
import { randomUUID } from 'node:crypto';

import multer from 'multer';
import fs from 'fs';
import { parse } from 'csv-parse';

const database = new Database();

export const routes = [
  {
    method: 'GET',
    path: buildRoutePath('/tasks'),
    handler: (req, res) => {
      console.log("query", req.query);
      const { search } = req.query;

      const users = database.select('tasks', search ? {
        title: search
      } : null);

      return res
        .writeHead(200)
        .end(JSON.stringify(users));
    }
  },
  {
    method: 'POST',
    path: buildRoutePath('/tasks'),
    handler: (req, res) => {
      console.log("rota POST tasks");
      
      const { title, description } = req.body;
      const id = randomUUID();
      
      const newTask = {
        id,
        title,
        description,
        checked: false,
        completed_at: null,
        created_at: Date.now(),
        updated_at: null
      }

      database.insert('tasks', newTask);
    
      return res
        .writeHead(201)
        .end();
    }
  },
  {
    method: 'POST',
    path: buildRoutePath('/tasks/csv'),
    handler: (req, res) => {
      console.log("rota POST CSV tasks");
      // Configuração do multer para lidar com uploads
      const upload = multer({ dest: 'uploads/' });
      // Chame o middleware upload.single() para processar a requisição
      upload.single('csvFile')(req, res, (err) => {
        if (!req.file) {
          return res.writeHead(400).end('Nenhum arquivo CSV enviado.');
        }
        const csvFilePath = req.file.path;
       
        fs.createReadStream(csvFilePath)
          .pipe(parse({ delimiter: ',' })) // Configura o delimitador para ',' (vírgula)
          .on('data', async (row, rowIndex ) => {
            // Pular a primeira linha (índice 0) que contém os cabeçalhos
            if(rowIndex <= 1) return;
            console.log(row,'row');
            // Mapear os campos do CSV para um objeto
            const [title, description] = row;
            if(title === 'title' && description==='description') return;

            // Fazer a solicitação POST para a rota '/tasks/csv'
            const id = randomUUID();
            const newTask = {
              id,
              title,
              description,
              checked: false,
              completed_at: null,
              created_at: Date.now(),
              updated_at: null
            }
      
            database.insert('tasks', newTask);
          })
          .on('end', () => {
            console.log('Leitura do arquivo CSV concluída.');
            return res
            .end()
            .writeHead(201)
          });
      });

      return res
        .writeHead(200)
        .end();
    }
  },
  {
    method: 'PUT',
    path: buildRoutePath('/tasks/:id'),
    handler: (req, res) => {
      console.log("rota PUT tasks");

      const { id } = req.params;
      const {
        title,
        description
      } = req.body;
      
      const user = database.select('tasks', {
        id: id
      });

      database.update('tasks', id, { 
        title, 
        description, 
        checked: user[0].checked,
        completed_at: user[0].completed_at,
        created_at: user[0].created_at,
        updated_at: Date.now()
      });
    
      return res.writeHead(204).end();
    }
  },
  {
    method: 'DELETE',
    path: buildRoutePath('/tasks/:id'),
    handler: (req, res) => {
      console.log("rota DELETE tasks");
      const { id } = req.params;
      
      database.delete('tasks', id);
    
      return res.writeHead(204).end();
    }
  },
  {
    method: 'GET',
    path: buildRoutePath('/tasks/seed'),
    handler: (req, res) => {
      console.log("rota seed tasks");
      
      database.seed('tasks');
    
      return res.writeHead(204).end();
    }
  },
  {
    method: 'PATCH',
    path: buildRoutePath('/tasks/:id/complete'),
    handler: (req, res) => {
      console.log("rota patch tasks");

      const { id } = req.params;
      const {
        checked,
      } = req.body;

      const user = database.select('tasks', {
        id: id
      });

      database.update('tasks', id, { 
        ...user[0],
        completed_at: checked ? Date.now() : null,
        updated_at: Date.now(),
        checked
      });
    
      return res.writeHead(204).end();
    }
  },
]