const pool = require('../db');
const bcrypt = require('bcrypt');

/**
 * Obtiene lista de usuarios con filtros de estado
 * @param {Object} req - Express request
 * @param {string} req.query.estado - 'activos' | 'inactivos' | 'all' (default: 'activos')
 * @param {Object} res - Express response
 * @returns {Array} Array de usuarios con datos de planta
 */
const obtenerUsuarios = async (req, res) => {
  try {
    // valores aceptados: 'activos' (default), 'inactivos', 'all'
    const estadoQuery = String(req.query.estado || '')
      .trim()
      .toLowerCase();
    const estadoMode =
      estadoQuery === 'all' ||
      estadoQuery === 'inactivos' ||
      estadoQuery === 'activos'
        ? estadoQuery
        : 'activos';

    let where = '';
    if (estadoMode === 'activos') where = 'WHERE u.estado = true';
    else if (estadoMode === 'inactivos') where = 'WHERE u.estado = false';
    // 'all' => sin WHERE

    const q = `
      SELECT u.*, p.nombre AS planta_nombre
      FROM usuario u
      LEFT JOIN planta p ON u.id_planta = p.id_planta
      ${where}
      ORDER BY u.id_usuario ASC
    `;
    const resultado = await pool.query(q);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/**
 * Obtiene datos del usuario autenticado con info de planta
 * @param {Object} req - Express request con user del JWT
 * @param {Object} res - Express response
 * @returns {Object} Usuario actual con datos de planta
 */
const usuarioActual = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario;
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });

    const q = `
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.n_telefono,
        u.id_planta,
        p.nombre AS planta_nombre,
        r.descripcion AS rol
      FROM usuario u
      LEFT JOIN planta p ON u.id_planta = p.id_planta
      LEFT JOIN rol_usuario r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = $1
      LIMIT 1
    `;
    const result = await pool.query(q, [id_usuario]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    const row = result.rows[0];
    // enviar formato compacto (id_planta + planta_nombre para facilitar preselección en frontend)
    res.json({
      id_usuario: row.id_usuario,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      dni: row.dni,
      n_telefono: row.n_telefono,
      id_planta: row.id_planta,
      planta: row.planta_nombre ?? null,
      rol: row.rol ?? null,
    });
  } catch (err) {
    console.error('Error al obtener usuario actual:', err);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
};

// Crear nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      email,
      password,
      id_rol,
      estado,
      id_planta,
      n_telefono,
    } = req.body;

    const estadoBooleano = normalizarEstado(estado);
    const contraseniaHasheada = await bcrypt.hash(password, 10);
    const id_rol_num = parseInt(id_rol, 10) || 3;
    const id_planta_num = parseInt(id_planta, 10);
    if (!id_planta || isNaN(id_planta_num)) {
      console.warn('ID de planta inválido recibido:', id_planta);
      return res.status(400).json({ error: 'Planta inválida' });
    }

    const resultado = await pool.query(
      `INSERT INTO usuario (
        nombre, apellido, dni, email, contrasenia,
        id_rol, estado, id_planta, n_telefono, creado_en
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, NOW()
      ) RETURNING *`,
      [
        nombre,
        apellido,
        dni,
        email,
        contraseniaHasheada,
        id_rol_num,
        estadoBooleano,
        id_planta_num,
        n_telefono,
      ],
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      dni,
      email,
      password,
      id_rol,
      estado,
      id_planta,
      n_telefono,
    } = req.body;

    const estadoBooleano = normalizarEstado(estado);
    const id_rol_num = parseInt(id_rol, 10) || 3;
    const id_planta_num = parseInt(id_planta, 10);
    if (!id_planta || isNaN(id_planta_num)) {
      console.warn('ID de planta inválido recibido:', id_planta);
      return res.status(400).json({ error: 'Planta inválida' });
    }

    let query;
    let params;

    if (password && password.trim() !== '') {
      const contraseniaHasheada = await bcrypt.hash(password, 10);
      query = `
        UPDATE usuario SET
          nombre = $1, apellido = $2, dni = $3, email = $4,
          contrasenia = $5, id_rol = $6, estado = $7,
          id_planta = $8, n_telefono = $9
        WHERE id_usuario = $10 RETURNING *`;
      params = [
        nombre,
        apellido,
        dni,
        email,
        contraseniaHasheada,
        id_rol_num,
        estadoBooleano,
        id_planta_num,
        n_telefono,
        id,
      ];
    } else {
      query = `
        UPDATE usuario SET
          nombre = $1, apellido = $2, dni = $3, email = $4,
          id_rol = $5, estado = $6,
          id_planta = $7, n_telefono = $8
        WHERE id_usuario = $9 RETURNING *`;
      params = [
        nombre,
        apellido,
        dni,
        email,
        id_rol_num,
        estadoBooleano,
        id_planta_num,
        n_telefono,
        id,
      ];
    }

    const resultado = await pool.query(query, params);
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario (soft delete)
const eliminarUsuario = async (req, res) => {
  try {
    const id_usuario = parseInt(req.params.id, 10);

    if (isNaN(id_usuario)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const resultado = await pool.query(
      'UPDATE usuario SET estado = false WHERE id_usuario = $1',
      [id_usuario],
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};

// Obtener perfil del usuario logueado
const getPerfil = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.dni, u.n_telefono, u.creado_en,
              p.nombre AS planta, r.descripcion AS rol
       FROM usuario u
       LEFT JOIN planta p ON u.id_planta = p.id_planta
       LEFT JOIN rol_usuario r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = $1`,
      [id_usuario],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// ✅ Actualizar perfil del usuario logueado (solo campos enviados)
const updatePerfil = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { email, n_telefono } = req.body;

    const campos = [];
    const valores = [];
    let index = 1;

    if (email !== undefined) {
      campos.push(`email = $${index++}`);
      valores.push(email);
    }

    if (n_telefono !== undefined) {
      campos.push(`n_telefono = $${index++}`);
      valores.push(n_telefono);
    }

    if (campos.length === 0) {
      return res
        .status(400)
        .json({ error: 'No se enviaron campos para actualizar' });
    }

    valores.push(id_usuario); // último parámetro para WHERE

    const query = `UPDATE usuario SET ${campos.join(', ')} WHERE id_usuario = $${index}`;
    await pool.query(query, valores);

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// Mapear rol desde string a número
const mapRol = (rol) => {
  if (typeof rol !== 'string') return 3;

  switch (rol.toLowerCase()) {
    case 'superadmin':
      return 1;
    case 'supervisor':
      return 2;
    case 'usuario':
      return 3;
    default:
      return 3;
  }
};

// Normalizar estado desde string, boolean o número
function normalizarEstado(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    return limpio === 'activo' || limpio === 'true' || limpio === '1';
  }
  if (typeof valor === 'number') return valor === 1;
  return false;
}

// Cambiar estado de un usuario (PATCH minimalista)
const cambiarEstadoUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body;

    if (isNaN(id))
      return res.status(400).json({ error: 'ID de usuario inválido' });
    const estadoBooleano = normalizarEstado(estado);

    const r = await pool.query(
      'UPDATE usuario SET estado = $1 WHERE id_usuario = $2 RETURNING *',
      [estadoBooleano, id],
    );

    if (r.rowCount === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Estado actualizado', usuario: r.rows[0] });
  } catch (err) {
    console.error('Error al cambiar estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
};

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getPerfil,
  updatePerfil,
  usuarioActual,
  cambiarEstadoUsuario, // <-- exportar
};
