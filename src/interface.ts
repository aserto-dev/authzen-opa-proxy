export interface AuthZENObject {
  type: string
  id: string
  properties?: {
    [key: string]: string
  }
}

export interface Subject extends AuthZENObject {}

export interface Resource extends AuthZENObject {}

export interface Action {
  name: string
  properties?: {
    [key: string]: string
  }
}

export interface Context {
  [key: string]: string
}

export interface EvaluationRequest {
  subject: Subject
  action: Action
  resource: Resource
  context?: Context
}

export interface Evaluations {
  subject?: Subject
  action?: Action
  resource?: Resource
  context?: Context
}

export interface EvaluationsRequest extends Evaluations {
  evaluations?: Evaluations[]
}

export interface User {
  id: string;
  email: string;
  picture: string;
  name: string;
  roles: Array<string>;
}
