import { Injectable } from "@angular/core";
//import { getString, setString, hasKey } from "tns-core-modules/application-settings";
import * as applicationSettings from "tns-core-modules/application-settings";
import { User } from "../models";
import * as fs from "tns-core-modules/file-system";

const fileName = "/decisionmaker/userData.json";
const file = fs.knownFolders.documents().getFile(fileName);
let doesMainUserExist: Boolean = false;
let mainUser: string = '';
export class BackendService {

  createNewUser(type: string, user: User): Promise<Boolean> {
    return new Promise((resolve) => {
      file.readText().then(function (content) {
        let jsonObject = JSON.parse(content);
        jsonObject.users.push({ type: type, username: user.email });
        file.writeText(JSON.stringify(jsonObject));
      })
    });
    // clear data form the file
  }


  createUser(user: User) {
    applicationSettings.setString(user.password, user.email);
  }
  mainUserExists(): Promise<Boolean> {
    return new Promise((resolve) => {
      file.readText().then(function (content) {
        let jsonObject = JSON.parse(content);
        console.log(jsonObject);
        jsonObject.users.forEach(element => {
          if (element.type === 'mainuser') {
            mainUser = element.username;
            doesMainUserExist = true;
            resolve(doesMainUserExist);
          } else {
            doesMainUserExist = false;
          }
        })
      }).then(() => {
        resolve(doesMainUserExist);
      });
    });
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
