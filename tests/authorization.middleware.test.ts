import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/environment';
import { authenticate } from '../src/middlewares/auth.middleware';
import { authorize } from '../src/middlewares/role.middleware';
import { UserRole } from '../src/models/user.model';

interface ResponseSpies {
  response: Response;
  status: jest.Mock;
  json: jest.Mock;
}

const createResponse = (): ResponseSpies => {
  const status = jest.fn();
  const json = jest.fn();
  status.mockReturnValue({ json });

  return {
    response: { status, json } as unknown as Response,
    status,
    json,
  };
};

describe('Authorization middleware', () => {
  it('returns 401 when a protected route has no JWT', () => {
    const request = { headers: {} } as unknown as Request;
    const { response, status, json } = createResponse();
    const next = jest.fn() as NextFunction;

    authenticate(request, response, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Authentication required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when a REQUEST_MANAGER token accesses an ADMIN-only route', () => {
    const token = jwt.sign(
      { id: 2, email: 'manager@example.com', role: UserRole.REQUEST_MANAGER },
      config.jwt.secret,
    );
    const request = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const authenticationResponse = createResponse();
    const authenticationNext = jest.fn() as NextFunction;

    authenticate(request, authenticationResponse.response, authenticationNext);
    expect(authenticationNext).toHaveBeenCalledTimes(1);

    const { response, status, json } = createResponse();
    const authorizationNext = jest.fn() as NextFunction;
    authorize(UserRole.ADMIN)(request, response, authorizationNext);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'Forbidden: insufficient permissions.' });
    expect(authorizationNext).not.toHaveBeenCalled();
  });
});