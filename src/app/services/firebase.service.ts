import { Injectable, NgZone } from "@angular/core";
import { User, Gift } from "../models";
import { BackendService } from "./backend.service";
import firebase = require("nativescript-plugin-firebase");
import { Observable, BehaviorSubject } from 'rxjs';
import { UtilsService } from './utils.service';
import { share } from 'rxjs/operators';
import { knownFolders, path, Folder, File } from "tns-core-modules/file-system";
import * as fs from "file-system";
@Injectable()
export class FirebaseService {
  constructor(
    private ngZone: NgZone,
    private utils: UtilsService
  ) { }

  items: BehaviorSubject<Array<Gift>> = new BehaviorSubject([]);

  private _allItems: Array<Gift> = [];

  uploadFile(imagePath: string, filename: string, file?: any): Promise<any> {
    //let imagePath = knownFolders.temp().getFolder("100APPLE").path

    return firebase.storage.uploadFile({
      remoteFullPath: 'uploads/' + filename,
      localFullPath: imagePath,
      onProgress: function (status) {
        // console.log("Uploaded fraction: " + status.fractionCompleted);
        // console.log("Percentage complete: " + status.percentageCompleted);
      }
    });
  }

  getImages() {
    const documents = fs.knownFolders.documents();
    const logoPath = documents.path + "/camera.png";

    // this will create or overwrite a local file in the app's documents folder
    const localLogoFile = documents.getFile("camera.png");

    // now download the file with either of the options below:
    firebase.storage.downloadFile({
      // the full path of an existing file in your Firebase storage
      remoteFullPath: 'uploads/camera.png',
      // option 1: a file-system module File object
      localFile: fs.File.fromPath(logoPath),
      // option 2: a full file path (ignored if 'localFile' is set)
      localFullPath: logoPath
    }).then(
      function (uploadedFile) {
        console.log("File downloaded to the requested location");
      },
      function (error) {
        console.log("File download error: " + error);
      }
    );
  }

  register(user: User) {
    return firebase.createUser({
      email: user.email,
      password: user.password
    }).then(
      function (result: any) {
        return JSON.stringify(result);
      },
      function (errorMessage: any) {
        alert(errorMessage);
      }
    )
  }

  login(user: User) {
    return firebase.login({
      type: firebase.LoginType.PASSWORD,
      email: user.email,
      password: user.password
    }).then((result: any) => {
      BackendService.token = result.uid;
      return JSON.stringify(result);
    }, (errorMessage: any) => {
      alert(errorMessage);
    });
  }

  logout() {
    BackendService.token = "";
    firebase.logout();
  }

  resetPassword(email) {
    return firebase.sendPasswordResetEmail(
      email
    ).then((result: any) => {
      alert(JSON.stringify(result));
    },
      function (errorMessage: any) {
        alert(errorMessage);
      }
    ).catch(this.handleErrors);
  }

  getMyWishList(): Observable<any> {
    return new Observable((observer: any) => {
      let path = 'Gifts';

      let onValueEvent = (snapshot: any) => {
        this.ngZone.run(() => {
          let results = this.handleSnapshot(snapshot.value);
          console.log(JSON.stringify(results))
          observer.next(results);
        });
      };
      firebase.addValueEventListener(onValueEvent, `/${path}`);
    }).pipe(share());
  }

  getMyGift(id: string): Observable<any> {
    return new Observable((observer: any) => {
      observer.next(this._allItems.filter(s => s.id === id)[0]);
    }).pipe(share());
  }

  getMyMessage(): Observable<any> {
    return new Observable((observer: any) => {
      firebase.getRemoteConfig({
        developerMode: false, // play with this boolean to get more frequent updates during development
        cacheExpirationSeconds: 300, // 10 minutes, default is 12 hours.. set to a lower value during dev
        properties: [{
          key: "message",
          default: "Happy Holidays!"
        }]
      }).then(
        function (result) {
          console.log("Fetched at " + result.lastFetch + (result.throttled ? " (throttled)" : ""));
          for (let entry in result.properties) {
            observer.next(result.properties[entry]);
          }
        }
      );
    }).pipe(share());
  }



  handleSnapshot(data: any) {
    //empty array, then refill and filter
    this._allItems = [];
    if (data) {
      for (let id in data) {
        let result = (<any>Object).assign({ id: id }, data[id]);
        if (BackendService.token === result.UID) {
          this._allItems.push(result);
        }
      }
      this.publishUpdates();
    }
    return this._allItems;
  }

  publishUpdates() {
    // here, we sort must emit a *new* value (immutability!)
    this._allItems.sort(function (a, b) {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    })
    this.items.next([...this._allItems]);
  }

  add(gift: string) {
    return firebase.push(
      "/Gifts",
      { "name": gift, "UID": BackendService.token, "date": 0 - Date.now(), "imagepath": "" }
    ).then(
      function (result: any) {
        return 'Gift added to your wishlist!';
      },
      function (errorMessage: any) {
        console.log(errorMessage);
      });
  }

  editGift(id: string, description: string, imagepath: string) {
    this.publishUpdates();
    return firebase.update("/Gifts/" + id + "", {
      description: description,
      imagepath: imagepath
    })
      .then(
        function (result: any) {
          return 'You have successfully edited this gift!';
        },
        function (errorMessage: any) {
          console.log(errorMessage);
        });
  }
  editDescription(id: string, description: string) {
    this.publishUpdates();
    return firebase.update("/Gifts/" + id + "", {
      description: description
    })
      .then(
        function (result: any) {
          return 'You have successfully edited the description!';
        },
        function (errorMessage: any) {
          console.log(errorMessage);
        });
  }
  delete(gift: Gift) {
    return firebase.remove("/Gifts/" + gift.id + "")
      .catch(this.handleErrors);
  }



  getDownloadUrl(remoteFilePath: string): Promise<any> {
    return firebase.storage.getDownloadUrl({
      remoteFullPath: remoteFilePath
    })
      .then(
        function (url: string) {
          return url;
        },
        function (errorMessage: any) {
          console.log(errorMessage);
        });
  }

  handleErrors(error) {
    console.log(JSON.stringify(error));
    return Promise.reject(error.message);
  }
}