import http from 'node:http';
import { routes } from './routes.js';
import { json } from './middlewares/json.js';
import { extractQueryParams } from './utils/extract-query-params.js';

import multer from 'multer';

const app = http.createServer(async (req, res) => {
  const upload = multer({ dest: 'uploads/' });
  
  const { method, url } = req;
  console.log(method, url,'req method|url');

  if (method === 'POST' && url === '/tasks/csv') {
    // Lidere com o upload de arquivos usando multer
    upload.single('csvFile')(req, res, async (err) => {
      if (err) {
        console.error('Erro ao processar upload de arquivo:', err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
      }

      // Verifique se o campo 'csvFile' foi enviado no corpo da solicitação
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
      }

      try {
        console.log(req.file,'file')

        const route = routes.find(route => {
          return route.method === method && route.path.test(url)
        });
 
        if(route) {
          console.log(route,'find route success');
      
          return route.handler(req, res);
        }

        // Responda à solicitação quando o processamento estiver concluído.
        return res.writeHead(201).end('Upload de arquivo CSV concluído com sucesso.');
      } catch (error) {
        console.error('Erro ao lidar com o upload de arquivo:', error);
        return res.writeHead(500).end('Erro interno do servidor.');
      }
    });
  } else {
    await json(req, res);
  
    const route = routes.find(route => {
      return route.method === method && route.path.test(url)
    });
    
    if(route) {
      console.log(route,'find route success');
  
      const routeParams = req.url.match(route.path);
      const { query, ...params} = routeParams.groups;
  
      req.params = params;
      req.query = query ? extractQueryParams(query) : {};
  
      return route.handler(req, res);
    }
  
    console.log("app running on port 3339");
  
    return res.writeHead(204).end();
  }
});

app.listen(3339);