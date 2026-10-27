function fn() {
  var token = java.lang.System.getenv('GOREST_TOKEN');
  if (!token || !token.trim()) {
    throw new Error('Falta GOREST_TOKEN. Configura el token de GoREST en el entorno o en Jenkins.');
  }
  var SafeHttpLogModifier = Java.type('Utils.SafeHttpLogModifier');
  karate.configure('logModifier', new SafeHttpLogModifier());
  karate.configure('headers', {
    Authorization: 'Bearer ' + token.trim(),
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });
  karate.configure('connectTimeout', 30000);
  karate.configure('readTimeout', 30000);
  return {
    env: karate.env || 'dev',
    baseUrl: 'https://gorest.co.in/public/v2'
  };
}
