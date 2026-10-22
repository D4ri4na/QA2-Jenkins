const fs = require('node:fs');
const path = require('node:path');
const newman = require('newman');
const root = path.resolve(__dirname, '..');
const token = process.env.GOREST_TOKEN;
if (!token) {
  console.error('Falta GOREST_TOKEN. Configura la credencial Secret text qa2-gorest-token en Jenkins.');
  process.exit(1);
}
const environment = JSON.parse(fs.readFileSync(path.join(root, 'QA2Enviroment-DPA (2).postman_environment'), 'utf8'));
environment.values = environment.values.filter(value => value.key !== 'token');
environment.values.push({key: 'token', value: token, enabled: true});
const reports = path.join(root, 'reports');
fs.mkdirSync(reports, {recursive: true});
newman.run({
  collection: path.join(root, 'QA2-DPA (2).postman_collection'),
  environment,
  timeoutRequest: 30000,
  timeoutScript: 10000,
  reporters: ['cli', 'junit', 'html'],
  reporter: {
    junit: {export: path.join(reports, 'junit.xml')},
    html: {export: path.join(reports, 'Newman_Report.html'), template: path.join(__dirname, 'report.hbs')}
  }
}, (error, summary) => {
  if (error) {
    console.error(error.message.split(token).join('[REDACTED]'));
    process.exitCode = 1;
    return;
  }
  const stats = summary.run.stats;
  console.log(`Resultado: ${stats.requests.total} peticiones, ${stats.assertions.total} comprobaciones, ${summary.run.failures.length} fallos.`);
  fs.writeFileSync(path.join(reports, 'summary.json'), JSON.stringify({stats, failures: summary.run.failures.length}, null, 2));
  process.exitCode = summary.run.failures.length ? 1 : 0;
});
