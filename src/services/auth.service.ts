import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { UserRole } from '../models/user.model';
import { config } from '../config/environment';
import { SafeUser } from '../types';

const MIN_PASSWORD_LENGTH = 6;

/** Data required to create an account with an application role. */
export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/** Credentials accepted by the login workflow. */
export interface LoginUserInput {
  email: string;
  password: string;
}

/** Error enriched with the HTTP status expected by controllers. */
export interface AuthError extends Error {
  statusCode: number;
}

/** Successful authentication result returned to controllers. */
export interface AuthenticatedResponse {
  token: string;
  user: SafeUser;
}

/** Create an error that controllers can translate into an HTTP response. */
const makeAuthError = (message: string, statusCode: number): AuthError => {
  const error = new Error(message) as AuthError;
  error.statusCode = statusCode;
  return error;
};

/** Trim and lowercase an email address before lookup or persistence. */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Check that a string has the email shape required by registration. */
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Remove the password hash before returning a user outside this service. */
const sanitizeUser = (user: User): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/**
 * Build a JWT response without exposing the stored password.
 * @param user Sanitized user data included in the token response.
 * @returns The signed token and safe user data.
 * @throws {AuthError} If token configuration cannot produce a valid token.
 */
export const createAuthenticatedResponse = (user: SafeUser): AuthenticatedResponse => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  return { token, user };
};

/** Validate mandatory registration fields and supported roles. */
const validateRegisterInput = (input: Partial<RegisterUserInput>): void => {
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    throw makeAuthError('Name is required.', 400);
  }

  if (typeof input.email !== 'string' || input.email.trim() === '') {
    throw makeAuthError('Email is required.', 400);
  }

  if (!isValidEmail(input.email)) {
    throw makeAuthError('A valid email is required.', 400);
  }

  if (typeof input.password !== 'string' || input.password.trim() === '') {
    throw makeAuthError('Password is required.', 400);
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw makeAuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, 400);
  }

  if (!input.role || !Object.values(UserRole).includes(input.role)) {
    throw makeAuthError('Role must be ADMIN or REQUEST_MANAGER.', 400);
  }
};

/** Validate that both credentials required by login are present. */
const validateLoginInput = (input: Partial<LoginUserInput>): void => {
  if (typeof input.email !== 'string' || input.email.trim() === '') {
    throw makeAuthError('Email is required.', 400);
  }

  if (typeof input.password !== 'string' || input.password.trim() === '') {
    throw makeAuthError('Password is required.', 400);
  }
};

/**
 * Validate, normalize, hash, and persist a new user.
 * @param input Registration data supplied by the caller.
 * @returns The persisted user without its password.
 * @throws {AuthError} With status 400 for invalid data or 409 for a duplicate email.
 */
export const registerUser = async (input: RegisterUserInput): Promise<SafeUser> => {
  validateRegisterInput(input);

  const normalizedEmail = normalizeEmail(input.email);
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });

  if (existingUser) {
    throw makeAuthError('Email is already registered.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    password: passwordHash,
    role: input.role,
  });

  return sanitizeUser(user);
};

/**
 * Validate credentials and return a signed authentication response.
 * @param input Login credentials supplied by the caller.
 * @returns The signed token and authenticated user data.
 * @throws {AuthError} With status 400 for missing credentials or 401 for invalid credentials.
 */
export const loginUser = async (input: LoginUserInput): Promise<AuthenticatedResponse> => {
  validateLoginInput(input);

  const normalizedEmail = normalizeEmail(input.email);
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw makeAuthError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw makeAuthError('Invalid email or password.', 401);
  }

  return createAuthenticatedResponse(sanitizeUser(user));
};
