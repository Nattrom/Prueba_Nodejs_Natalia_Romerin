import { jest, describe, expect, it, beforeEach } from "@jest/globals";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../src/models/user.model';
import * as authService from '../src/services/auth.service';

jest.mock('../src/models/user.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  UserRole: {
    ADMIN: 'ADMIN',
    REQUEST_MANAGER: 'REQUEST_MANAGER',
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

const mockedUserModel = jest.mocked(User);
const mockedBcrypt = jest.mocked(bcrypt);
const mockedJwt = jest.mocked(jwt);

describe('Auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user with a hashed password', async () => {

    mockedUserModel.findOne.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as any); 
    mockedUserModel.create.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      role: UserRole.ADMIN,
    } as any);

    const result = await authService.registerUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secure123',
      role: UserRole.ADMIN,
    });

    expect(result.email).toBe('john@example.com');
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('secure123', 10);
    expect(mockedUserModel.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      role: UserRole.ADMIN,
    });
  });

  it('creates a token for a newly registered user', () => {
    mockedJwt.sign.mockReturnValue('jwt-token' as any);

    const result = authService.createAuthenticatedResponse({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.ADMIN,
    });

    expect(result.token).toBe('jwt-token');
    expect(result.user.email).toBe('john@example.com');
    expect(mockedJwt.sign).toHaveBeenCalled();
  });

  it('logs in an existing user when the password is valid', async () => {
    mockedUserModel.findOne.mockResolvedValue({
      id: 5,
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashed-pass',
      role: UserRole.REQUEST_MANAGER,
    } as any);
    mockedBcrypt.compare.mockResolvedValue(true as any);
    mockedJwt.sign.mockReturnValue('jwt-token' as any);

    const result = await authService.loginUser({
      email: 'Jane@Example.com',
      password: 'secure123',
    });

    expect(result.token).toBe('jwt-token');
    expect(result.user.email).toBe('jane@example.com');
    expect(mockedJwt.sign).toHaveBeenCalled();
  });
});
