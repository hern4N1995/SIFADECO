/**
 * Endpoint de diagnóstico para verificar el estado de autenticación y cookies
 */

module.exports = (req, res) => {
  console.log('[DIAGNOSTICO]', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer ' + req.headers['authorization'].substring(0, 20) + '...' : 'NO PRESENTE',
      'x-csrf-token': req.headers['x-csrf-token'] ? req.headers['x-csrf-token'].substring(0, 20) + '...' : 'NO PRESENTE',
      'origin': req.headers['origin'],
      'referer': req.headers['referer'],
    },
    body: req.body,
    user: req.user ? { id_usuario: req.user.id_usuario, nombre_usuario: req.user.nombre_usuario } : 'NO AUTENTICADO',
    query: req.query,
  });

  res.json({
    timestamp: new Date().toISOString(),
    headers: {
      'Content-Type': req.headers['content-type'],
      'Authorization': req.headers['authorization'] ? 'Bearer [presente]' : 'NO PRESENTE ❌',
      'X-CSRF-Token': req.headers['x-csrf-token'] ? '[presente]' : 'NO PRESENTE ⚠️',
      'Origin': req.headers['origin'],
    },
    auth: {
      authenticated: !!req.user,
      userId: req.user?.id_usuario || null,
      username: req.user?.nombre_usuario || null,
    },
    body: {
      received: Object.keys(req.body),
      data: req.body,
    },
    notes: [
      'Si Authorization es NO PRESENTE, el token no se está enviando',
      'Si X-CSRF-Token es NO PRESENTE, el CSRF token no se está enviando',
      'Si authenticated es false, el usuario no está logueado',
    ],
  });
};
