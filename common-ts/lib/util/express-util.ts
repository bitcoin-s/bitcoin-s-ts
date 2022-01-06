import { Request } from 'express'

export interface BodyRequest<T> extends Request {
  body: T
}
