// Quality Gate + dashboard HTML autonomo a partir de los reportes JSON de Newman.
// El reporte original de Newman se borra tras resumirlo: puede contener el token.
'use strict';
const fs=require('fs');
const path=require('path');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc,v,i,a)=>{if(i%2===0)acc.push([v.replace(/^--/,''),a[i+1]]);return acc;},[]));
const mode=args.modo || 'COMPLETO';
const withNeg=mode==='COMPLETO' && args.negativas!=='false';
const maxAverage=Number(args.promedio || 3000);
const maxP95=Number(args.p95 || 5000);
const forced=args.simular==='true';
const expected=[['Smoke','smoke',3]];
if(mode==='COMPLETO')expected.push(['Regresion','regresion',15]);
if(withNeg)expected.push(['Negativas','negativas',4]);
let issues=[], suites=[], allDurations=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [label,key,count] of expected){
  const file=path.join('reports',`raw-${key}.json`);
  if(!fs.existsSync(file)){
    issues.push(`${label}: Newman no genero su reporte JSON`);
    suites.push({name:label,key,requests:0,assertions:0,failures:0,requestsFailed:0,details:[]});
    continue;
  }
  let r;
  try {r=JSON.parse(fs.readFileSync(file,'utf8'));}
  catch(e){issues.push(`${label}: reporte JSON ilegible`);fs.rmSync(file,{force:true});continue;}
  finally {fs.rmSync(file,{force:true});}
  const run=r.run||{};
  const stats=run.stats||{};
  const executions=run.executions||[];
  const details=executions.map(ex=>({
    name:String(ex.item?.name||'Peticion sin nombre'),
    method:String(ex.request?.method||''),
    status:typeof ex.response?.code==='number'?ex.response.code:null,
    ms:typeof ex.response?.responseTime==='number'?ex.response.responseTime:null,
    failedAssertions:(ex.assertions||[]).filter(a=>a.error).length,
    error:!!ex.requestError
  }));
  for(const d of details)if(d.ms!==null)allDurations.push(d.ms);
  const s={name:label,key, requests:Number(stats.requests?.total??executions.length), assertions:Number(stats.assertions?.total||0),
    failures:Number(stats.assertions?.failed||0), requestsFailed:Number(stats.requests?.failed||0),
    failuresTotal:Array.isArray(run.failures)?run.failures.length:0, details};
  suites.push(s);
  if(s.requests!==count)issues.push(`${label}: se ejecutaron ${s.requests} de ${count} solicitudes`);
  if(s.assertions===0)issues.push(`${label}: no se registraron aserciones`);
  if(s.failures>0||s.requestsFailed>0||s.failuresTotal>0)issues.push(`${label}: ${s.failures} aserciones fallidas, ${s.requestsFailed} peticiones fallidas, ${s.failuresTotal} errores de Newman`);
}
const requests=suites.reduce((n,s)=>n+s.requests,0);
const assertions=suites.reduce((n,s)=>n+s.assertions,0);
const failed=suites.reduce((n,s)=>n+s.failures,0);
const avg=allDurations.length ? allDurations.reduce((a,b)=>a+b,0)/allDurations.length:null;
const sorted=[...allDurations].sort((a,b)=>a-b);
const p95=sorted.length ? sorted[Math.ceil(sorted.length*0.95)-1] : null;
const pct=assertions?((assertions-failed)*100/assertions):0;
if(!(maxAverage>0&&maxP95>0))issues.push('Parametros de rendimiento invalidos');
if(avg===null)issues.push('No hay tiempos de respuesta medibles');
if(avg!==null&&avg>maxAverage)issues.push(`Promedio ${avg.toFixed(0)} ms supera limite ${maxAverage} ms`);
if(p95!==null&&p95>maxP95)issues.push(`p95 ${p95.toFixed(0)} ms supera limite ${maxP95} ms`);
if(forced)issues.push('SIMULACION CONTROLADA: puerta de calidad rechaza el build para la demostracion');
const passed=issues.length===0;
const summary={title:'QA Continua | PruebaQA1', generatedAt:new Date().toISOString(), mode, negativeTests:withNeg,
  qualityGate:passed?'APROBADO':'RECHAZADO', simulatedFailure:forced,
  thresholds:{maxAverageMs:maxAverage,maxP95Ms:maxP95,minimumPassRate:100},
  metrics:{requests,assertions,assertionsPassed:assertions-failed,assertionsFailed:failed,passRate:Number(pct.toFixed(2)),averageMs:avg===null?null:Math.round(avg),p95Ms:p95},
  issues, suites};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/QA_Resumen.json',JSON.stringify(summary,null,2),'utf8');
const status=passed?'APROBADO':'RECHAZADO';
const symbol=passed?'✓':'✕';
const metric=(label,value,sub)=>`<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(sub)}</span></div>`;
const rows=suites.flatMap(s=>s.details.map(d=>`<tr><td>${esc(s.name)}</td><td>${esc(d.name)}</td><td>${esc(d.method)}</td><td>${esc(d.status??'N/D')}</td><td>${esc(d.ms===null?'N/D':d.ms+' ms')}</td><td><span class="${d.failedAssertions||d.error||d.status===null?'bad':'ok'}">${d.failedAssertions||d.error||d.status===null?'Revisar':'Ejecutada'}</span></td></tr>`)).join('\n');
const badges=suites.map(s=>`<div class="suite"><b>${esc(s.name)}</b><span>${s.requests} solicitudes</span><span>${s.assertions-s.failures}/${s.assertions} aserciones</span></div>`).join('');
const issueList=issues.length?'<ul>'+issues.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>':'<p>Todos los controles de la puerta de calidad fueron superados.</p>';
const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA Dashboard | Práctico 3</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{font-family:system-ui,Segoe UI,Arial,sans-serif;background:#0b1220;color:#e9f0fc;margin:0;padding:30px}main{max-width:1120px;margin:auto}header{background:linear-gradient(125deg,#172d50,#103d53);padding:30px;border-radius:18px;border:1px solid #42617b}.eyebrow{color:#70e4cd;font-size:13px;font-weight:800;letter-spacing:2px}h1{font-size:36px;margin:10px 0}p{color:#b6c9dc}.tag{font-size:13px;padding:7px 12px;border-radius:30px;border:1px solid #61788f}.status{font-size:19px;font-weight:900;color:${passed?'#6ae7ae':'#ff8383'}}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:24px 0}.metric,.suite,.panel{background:#152236;border:1px solid #31445d;border-radius:13px;padding:20px}.metric small{display:block;color:#adc5da}.metric strong{display:block;font-size:28px;margin:7px 0}.metric span{font-size:12px;color:#92a8bd}.suites{display:flex;flex-wrap:wrap;gap:10px}.suite{flex:1;min-width:180px;display:flex;flex-direction:column;gap:6px}.suite span{color:#b4cbdd;font-size:13px}.panel{margin:24px 0}.panel h2{margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;border-bottom:1px solid #2e435e;padding:12px 8px}th{color:#8abdd2}td{color:#d9e5f1}.ok{color:#69e4b4}.bad{color:#ff8e90}li{margin:8px 0;color:#ffd0cc}footer{color:#8ea3b6;font-size:12px;padding:12px}.overflow{overflow-x:auto}</style></head><body><main><header><div class="eyebrow">PRÁCTICO 3 · BLOQUE 2 · INGENIERÍA DE SOFTWARE</div><h1>Panel de calidad continua</h1><p>GitHub → Jenkins → Newman → Quality Gate → Reportes JUnit</p><span class="tag">Modo ${esc(mode)}</span> &nbsp; <span class="status">${symbol} ${status}</span><p>Generado: ${esc(summary.generatedAt)}</p></header><section class="grid">
${metric('Solicitudes',requests,`Modo ${mode}`)}${metric('Aserciones aprobadas',assertions-failed,`de ${assertions} totales`)}${metric('Éxito de aserciones',pct.toFixed(1)+'%','meta: 100%')}${metric('Promedio',avg===null?'N/D':avg.toFixed(0)+' ms',`límite: ${maxAverage} ms`)}${metric('Latencia p95',p95===null?'N/D':p95.toFixed(0)+' ms',`límite: ${maxP95} ms`)}
</section><div class="suites">${badges}</div><section class="panel"><h2>Quality Gate: ${status}</h2>${issueList}</section><section class="panel"><h2>Trazabilidad de peticiones</h2><div class="overflow"><table><thead><tr><th>Suite</th><th>Prueba</th><th>Método</th><th>HTTP</th><th>Duración</th><th>Registro</th></tr></thead><tbody>${rows}</tbody></table></div></section><footer>Dashboard generado con resultados reales de Newman. Un HTTP 4xx esperado en pruebas negativas constituye un resultado aprobado. Consultar el reporte JUnit para identificar las aserciones fallidas. No se incluyen tokens ni cuerpos de peticiones.</footer></main></body></html>`;
const extractedCss=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
fs.writeFileSync('reports/QA_Dashboard.css',extractedCss,'utf8');
fs.writeFileSync('reports/QA_Dashboard.html',html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="QA_Dashboard.css">'),'utf8');
console.log(`QUALITY GATE | ${status} | ${requests} requests | ${assertions-failed}/${assertions} assertions | avg ${avg===null?'N/D':Math.round(avg)} ms | p95 ${p95===null?'N/D':p95} ms`);
for(const issue of issues)console.error('  - '+issue);
process.exit(passed?0:1);
