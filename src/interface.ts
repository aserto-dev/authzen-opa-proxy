export interface AuthZenRequest {
  subject: {
    identity: string
  }
  action: {
    name: string
  }
  resource?: {
    ownerID: string
    type?: string
  }
  context?: {
    [key: string]: string
  }
}

export interface User {
  id: string;
  email: string;
  picture: string;
  name: string;
  roles: Array<string>;
}
