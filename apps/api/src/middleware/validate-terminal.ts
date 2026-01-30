import { Request, Response, NextFunction } from 'express';
import { Terminal, isValidTerminal } from '@incheon-dashboard/shared';
import { ValidationError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      terminal?: Terminal;
    }
  }
}

export function validateTerminal(req: Request, _res: Response, next: NextFunction): void {
  const terminalParam = req.params.terminal?.toUpperCase();

  if (!terminalParam) {
    throw new ValidationError('Terminal parameter is required');
  }

  if (!isValidTerminal(terminalParam)) {
    throw new ValidationError(`Invalid terminal: ${terminalParam}. Must be T1 or T2`);
  }

  req.terminal = terminalParam as Terminal;
  next();
}
