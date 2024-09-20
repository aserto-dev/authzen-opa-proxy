export interface AuthZenRequest {
  subject: {
    type: string
    id: string
    properties?: {
      [key: string]: string
    }
  }
  action: {
    name: string
    properties?: {
      [key: string]: string
    }
  }
  resource?: {
    type: string
    id: string
    properties?: {
      [key: string]: string
    }
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
