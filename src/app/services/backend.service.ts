import { Injectable } from "@angular/core";
//import { getString, setString, hasKey } from "tns-core-modules/application-settings";
import * as applicationSettings from "tns-core-modules/application-settings";
import { User } from "../models";
import * as fs from "tns-core-modules/file-system";

const fileName = "/decisionmaker/userData.json";
const file = fs.knownFolders.documents().getFile(fileName);
export class BackendService {

  createNewUser() {
    let data = [{ "id": "1", "value": "NativeScript" }];
    file.writeText(JSON.stringify(data));

    // read data from the file
    file.readText().then(function (content) {
      // content contains the data read from the file
      console.log(JSON.parse(content));
    });

    // clear data form the file
  }


  createUser(user: User) {
    applicationSettings.setString(user.password, user.email);
  }
  mainUserExists() {
    return applicationSettings.hasKey('mainuser');
  }
  getMainUser() {
    return applicationSettings.getString('mainuser');
  }
  setMainUser(mainuser: string, password: string) {
    applicationSettings.setString('mainuser', mainuser);
    applicationSettings.setString(password, mainuser);
  }
  getUser(password: string) {
    return applicationSettings.getString(password);
  }

  isLoggedIn(): boolean {
    return !!applicationSettings.getString("token");
  }

  get token(): string {
    return applicationSettings.getString("token");
  }

  set token(theToken: string) {
    applicationSettings.setString("token", theToken);
  }
}
