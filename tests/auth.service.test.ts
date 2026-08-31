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

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../src/models/user.model';
import * as authService from '../src/services/auth.service';

const mockedUserModel = User as unknown as {
  findOne: jest.Mock;
  create: jest.Mock;
};
const mockedBcrypt = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};
const mockedJwt = jwt as unknown as {
  sign: jest.Mock;
};

describe('Auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user with a hashed password', async () => {
    mockedUserModel.findOne.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed-password');
    mockedUserModel.create.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      role: 'ADMIN',
    });

    const result = await authService.registerUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secure123',
      role: 'ADMIN',
    });

    expect(result.email).toBe('john@example.com');
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('secure123', 10);
    expect(mockedUserModel.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      role: 'ADMIN',
    });
  });

  it('logs in an existing user when the password is valid', async () => {
    mockedUserModel.findOne.mockResolvedValue({
      id: 5,
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashed-pass',
      role: 'REQUEST_MANAGER',
    });
    mockedBcrypt.compare.mockResolvedValue(true);
    mockedJwt.sign.mockReturnValue('jwt-token');

    const result = await authService.loginUser({
      email: 'Jane@Example.com',
      password: 'secure123',
    });

    expect(result.token).toBe('jwt-token');
    expect(result.user.email).toBe('jane@example.com');
    expect(mockedJwt.sign).toHaveBeenCalled();
  });
});
