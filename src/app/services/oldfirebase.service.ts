import { Injectable, NgZone, OnInit } from "@angular/core";
import { firebase } from 'nativescript-plugin-firebase/firebase-common';
const fb = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";
import { Observable } from 'rxjs';
import { UtilsService } from './utils.service';
import * as fs from "tns-core-modules/file-system";
import { Item } from "../item/item";

@Injectable()
export class FirebaseService {
  public images: Array<Item> = [];
  public myImages$: Observable<Array<Item>>;
  public myImageurls: Array<String> = [];
  constructor(
    private zone: NgZone,
    private utils: UtilsService
  ) {
  }
  getImages(images: Array<Item>) {
    images.forEach(function (image) {
      const documents = fs.knownFolders.documents();
      const logoPath = documents.path + '/' + image.role;
      console.log(logoPath);
      // this will create or overwrite a local file in the app's documents folder
      const localLogoFile = documents.getFile(image.role);

      // now download the file with either of the options below:
      firebase.storage.downloadFile({
        // the full path of an existing file in your Firebase storage
        remoteFullPath: 'uploads/' + image.role,
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
    });
  }

  getImageNames(): void {
    this.myImages$ = Observable.create(subscriber => {
      const colRef: firestore.CollectionReference = fb.firestore().collection('imagenames');
      colRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
        this.zone.run(() => {
          this.images = [];
          this.myImageurls = [];
          snapshot.forEach(docSnap =>
            //this.images.push({ id: docSnap.id, name: this.tempFolderPath + '/' + docSnap.data().name, role: docSnap.data().name })
            this.getDownloadUrl('uploads/' + docSnap.data().name).then(data => {
              this.images.push({ id: docSnap.id, name: data, role: docSnap.data().name })
              this.myImageurls.push(data);
            })
          );
          subscriber.next(this.images);
        });
      });
    });
  }

  deleteImagesFromFirebase(imagename: string) {
    firebase.storage.deleteFile({
      remoteFullPath: 'uploads/' + imagename
    }).then(
      function () {
        console.log("File deleted.");
      },
      function (error) {
        console.log("File deletion Error: " + error);
      }
    );
  }

  getDownloadUrls(items: Array<Item>) {
    console.log('inside get urls');
    items.forEach(value => {
      this.getDownloadUrl('uploads/' + value.role).then(value => {
        console.log(value);
      });;
    })
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
  // resetPassword(email) {
  //   return firebase.sendPasswordResetEmail(
  //     email
  //   ).then((result: any) => {
  //     alert(JSON.stringify(result));
  //   },
  //     function (errorMessage: any) {
  //       alert(errorMessage);
  //     }
  //   ).catch(this.handleErrors);
  // }
  handleErrors(error) {
    console.log(JSON.stringify(error));
    return Promise.reject(error.message);
  }
}