// types/session.d.ts

//add user to session
import { Session } from 'express-session'
import "express-session";
import { IUser } from "../src/models/User";

declare module "express-session" {
  interface SessionData {
    user?: IUser; // Define the 'user' property in session data
  }
}
