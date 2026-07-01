declare global {
  namespace Express {
    interface User {
      _id: string;
      email: string;
      role: string;
    }
  }
}
