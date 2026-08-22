import type { Response } from 'express';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const ok = <T>(res: Response, data: T, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const fail = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({
    success: false,
    error: { code, message },
  });
};
