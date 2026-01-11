import { Request, Response } from 'express';

export interface User {
  username: string;
  password: string;
  contact: string;
}
export type Info = User;
export type Signup = User;
export interface ErrorMessage {
  field: string;
  code: string;
  message?: string;
}
export interface Result {
  status: number|string;
  errors?: ErrorMessage[];
  message?: string;
}
export interface SignupService<T extends User> {
  signup(user: T): Promise<Result|string|number>;
  verify(userId: string, code: string, password?: string): Promise<boolean>;
}
export type Log = (msg: string) => void;
export class SignupController<T extends User> {
  id: string;
  code: string;
  password: string;
  step: number;
  constructor(public log: Log, public service: SignupService<T>, public decrypt?: (cipherText: string) => string|undefined, step?: number, id?: string, code?: string, password?: string) {
    this.id = (id ? id : 'userId');
    this.code = (code ? code : 'code');
    this.password = (password ? password : 'password');
    this.step = (step !== undefined && step != null ? step : 1);
    this.signup = this.signup.bind(this);
    this.verify = this.verify.bind(this);
  }
  signup(req: Request, res: Response) {
    const user: T = req.body;
    if (!user.username || user.username.length === 0 || !user.contact || user.contact.length === 0) {
      return res.status(401).end('username and contact cannot be empty');
    }
    if (this.step === 1) {
      if (!user.password || user.password.length === 0) {
        return res.status(401).end('password cannot be empty');
      }
      if (this.decrypt) {
        const p = this.decrypt(user.password);
        if (p === undefined) {
          return res.status(401).end('cannot decrypt password');
        } else {
          user.password = p;
        }
      }
    }
    this.service.signup(user).then(r => {
      res.status(200).json(r).end();
    }).catch(err => handleError(err, res, this.log));
  }
  verify(req: Request, res: Response) {
    let userId = req.params[this.id] as string;
    let passcode = req.params[this.code] as string;
    let password: string|undefined = req.params[this.password] as string | undefined;
    if ((!userId || userId.length === 0) || (!passcode || passcode.length === 0)) {
      const user = req.body;
      userId = user[this.id];
      passcode = user[this.code];
      password = user[this.password];
    }
    if (this.step !== 1) {
      if (!passcode || passcode.length === 0) {
        return res.status(401).end('password cannot be empty');
      }
      if (this.decrypt) {
        const p = this.decrypt(password as string);
        if (p === undefined) {
          return res.status(401).end('cannot decrypt password');
        } else {
          password = p;
        }
      }
    } else {
      password = undefined;
    }
    this.service.verify(userId, passcode, password).then(r => {
      res.status(200).json(r).end();
    }).catch(err => handleError(err, res, this.log));
  }
}
export function handleError(err: any, res: Response, log?: (msg: string) => void) {
  if (log) {
    log(toString(err));
    res.status(500).end('Internal Server Error');
  } else {
    res.status(500).end(toString(err));
  }
}
export function toString(v: any): string {
  return typeof v === 'string' ? v : JSON.stringify(v);
}
