import { Injectable } from "@angular/core";
//import { getString, setString, hasKey } from "tns-core-modules/application-settings";
import * as applicationSettings from "tns-core-modules/application-settings";
import { User } from "../models";
import * as fs from "tns-core-modules/file-system";
import { File, path } from "tns-core-modules/file-system";

const fileName = "/decisionmaker/userData.json";
const documents = fs.knownFolders.documents();
const file = documents.getFile(fileName);
const filePath = path.join(documents.path, fileName);
let doesMainUserExist: Boolean = false;

export class BackendService {
  private mainUser: string = '';
  createNewUser(type: string, user: User): Promise<Boolean> {
    return new Promise((resolve) => {
      if (File.exists(filePath)) {
        file.readText().then(function (content) {
          if (content !== '') {
            let jsonObject = JSON.parse(content);
            jsonObject.users.push({ type: type, username: user.email });
            file.writeText(JSON.stringify(jsonObject));
          } else {
            let jsonStr = { users: [{ type: type, username: user.email }] };
            file.writeText(JSON.stringify(jsonStr));
          }

        })
      } else {
        let jsonStr = { users: [{ type: type, username: user.email }] };
        file.writeText(JSON.stringify(jsonStr));
      }

    });
    // clear data form the file
  }


  createUser(user: User) {
    applicationSettings.setString(user.password, user.email);
  }
  mainUserExists(): Promise<string> {
    return new Promise((resolve) => {
      if (File.exists(filePath)) {
        file.readText().then(function (content) {
          if (content !== '') {
            let jsonObject = JSON.parse(content);
            jsonObject.users.forEach(element => {
              if (element.type === 'mainuser') {
                resolve(element.username);
              }
            })
          } else {
            resolve('');
          }
        }).then(() => {
          //resolve(doesMainUserExist);
        });
      } else {
        resolve('');
      }
    });
  }
  getMainUser() {
    return this.mainUser;
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
