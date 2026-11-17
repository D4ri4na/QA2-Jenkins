// No usa dependencias adicionales. No imprime secretos.
'use strict';
const fs = require('fs');
const path = require('path');
const required = [
  'PruebaQA1.postman_collection.json',
  'PruebaQA1.postman_environment.json',
  'QA_Smoke.postman_collection.json',
  'QA_Negativas.postman_collection.json',
];
try {
  const data = {};
  for (const file of required) {
    if (!fs.existsSync(file)) throw new Error('Falta ' + file);
    data[file] = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const groups = data['PruebaQA1.postman_collection.json'].item;
  const items = groups.flatMap(group => group.item);
  if (items.length !== 15) throw new Error('La regresion esperaba exactamente 15 solicitudes');
  const names = items.map(item => item.name);
  const idx = name => names.indexOf(name);
  if (!(idx('POSTUser') < idx('POSTPost') && idx('POSTPost') < idx('POSTComment') && idx('POSTPost') < idx('POSTTodo') && idx('DELETEUser') === names.length - 1)) {
    throw new Error('Orden de dependencias incorrecto: usuario > recursos anidados > limpieza');
  }
  const environment = data['PruebaQA1.postman_environment.json'];
  const value = key => environment.values.find(v => v.key === key && v.enabled !== false)?.value;
  if (!value('url') || !process.env.GOREST_TOKEN) throw new Error('Falta URL en el environment o GOREST_TOKEN en el entorno');
  for (const file of required.filter(f => f.includes('_collection'))) {
    if (!data[file].info?.schema?.includes('collection/v2.1.0')) throw new Error('Esquema Postman 2.1 no reconocido en '+file);
  }
  fs.rmSync('reports', {recursive:true, force:true});
  fs.mkdirSync('reports', {recursive:true});
  console.log('PRECHECK OK | JSON validos, dependencias ordenadas, 15 pruebas E2E, token presente (valor oculto).');
} catch (err) {
  console.error('PRECHECK FAIL | ' + err.message);
  process.exit(1);
}
