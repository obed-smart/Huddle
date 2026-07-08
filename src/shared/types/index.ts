import { IUser } from "../../db/schema/schema.user";

export type AuthUser = {
  id: IUser["id"];
  email: IUser["email"];
  username: IUser["username"];
  displayName: IUser["displayName"];
  avatarUrl: IUser["avatarUrl"];
  bio: IUser["bio"];
  globalRole: IUser["globalRole"];
  isEmailVerified: IUser["isEmailVerified"];
};

export type PublicUser = {
  id: IUser["id"];
  username: IUser["username"];
  displayName: IUser["displayName"];
  avatarUrl: IUser["avatarUrl"];
  bio: IUser["bio"];
};
