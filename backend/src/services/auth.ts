import jwt, { type SignOptions } from "jsonwebtoken";
import { getSettings } from "../config/settings.js";
import { HttpException } from "../middlewares/exceptionHandler.js";
import type {
  JwtTokenPayload,
  LoginResponse,
  MockUser,
} from "../models/types.js";
import { formatRut, normalizeRut } from "../utils/rut.js";

/**
 * In-memory mock credentials for MVP evaluation (admin & user roles).
 * All Chilean RUTs below have valid Módulo 11 check digits.
 */
export const MOCK_USERS: readonly MockUser[] = [
  {
    id: "usr-admin-01",
    username: "admin",
    password: "AdminPassword123!",
    name: "Ejecutivo",
    role: "admin",
  },
  {
    id: "usr-client-01",
    username: "usuario",
    password: "UserPassword123!",
    name: "Juan Pérez",
    role: "user",
    rut: "12.345.678-9",
  },
  {
    id: "usr-client-02",
    username: "empresa",
    password: "EmpresaPassword123!",
    name: "Comercial Pepito SpA",
    role: "user",
    rut: "76.543.210-3",
  },
];

export class AuthService {
  /**
   * Authenticates a user against mock credentials (by username or RUT) and issues a signed JWT.
   */
  public login(usernameOrRut: string, password: string): LoginResponse {
    const normalizedInput = usernameOrRut.trim().toLowerCase();
    const normalizedRutInput = normalizeRut(usernameOrRut);

    const matchedUser = MOCK_USERS.find((candidate) => {
      const byUsername = candidate.username.toLowerCase() === normalizedInput;
      const byRut =
        candidate.rut !== undefined &&
        normalizeRut(candidate.rut) === normalizedRutInput;
      return byUsername || byRut;
    });

    if (!matchedUser || matchedUser.password !== password) {
      throw new HttpException(
        401,
        "Credenciales inválidas. Verifica tu usuario y contraseña.",
        "INVALID_CREDENTIALS",
      );
    }

    const payload: JwtTokenPayload = {
      sub: matchedUser.id,
      role: matchedUser.role,
      ...(matchedUser.role === "user" && matchedUser.rut
        ? { rut: formatRut(matchedUser.rut) }
        : {}),
    };

    const settings = getSettings();
    const signOptions: SignOptions = {
      expiresIn: settings.jwtExpiresIn as SignOptions["expiresIn"],
    };

    const token = jwt.sign(payload, settings.jwtSecret, signOptions);

    return {
      token,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        name: matchedUser.name,
        role: matchedUser.role,
        ...(matchedUser.role === "user" && matchedUser.rut
          ? { rut: formatRut(matchedUser.rut) }
          : {}),
      },
    };
  }

  /**
   * Verifies JWT signature and expiration, returning the typed payload.
   */
  public verifyToken(token: string): JwtTokenPayload {
    const settings = getSettings();

    try {
      const decoded = jwt.verify(token, settings.jwtSecret);
      if (
        typeof decoded !== "object" ||
        decoded === null ||
        typeof decoded.sub !== "string" ||
        (decoded.role !== "admin" && decoded.role !== "user")
      ) {
        throw new HttpException(
          401,
          "El token proporcionado tiene una estructura inválida.",
          "INVALID_TOKEN_PAYLOAD",
        );
      }

      return decoded as JwtTokenPayload;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new HttpException(
          401,
          "La sesión ha expirado. Por favor, inicia sesión nuevamente.",
          "TOKEN_EXPIRED",
        );
      }
      throw new HttpException(
        401,
        "Token de autenticación inválido o malformado.",
        "INVALID_TOKEN",
      );
    }
  }
}

export const authService = new AuthService();
