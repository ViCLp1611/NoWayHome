import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { TWO_FACTOR_PEPPER } from '../config/env.js'

/*
|--------------------------------------------------------------------------
| Utilidades de seguridad
|--------------------------------------------------------------------------
| Estas funciones concentran generacion de tokens, hash de tokens,
| generacion/hash de codigos 2FA y hash/comparacion de contrasenas.
|
| Seguridad:
| - Los tokens de recuperacion no se guardan en texto plano.
| - Los codigos 2FA se almacenan hasheados.
| - Las contrasenas nuevas se guardan con bcryptjs.
| - No imprimir entradas ni salidas de estas funciones.
*/
export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function generate2faCode() {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function hash2faCode(correo, code) {
  const normalizedEmail = typeof correo === 'string' ? correo.trim().toLowerCase() : ''

  return crypto
    .createHash('sha256')
    .update(`${normalizedEmail}:${code}:${TWO_FACTOR_PEPPER}`)
    .digest('hex')
}

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10)
}

export async function validatePassword(plainPassword, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') {
    return false
  }

  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword)
  }

  return plainPassword === storedPassword
}
