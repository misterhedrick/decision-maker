import { Injectable, NgZone, OnInit } from "@angular/core";
import { User, Gift } from "../models";
import { BackendService } from "./backend.service";
import firebase = require("nativescript-plugin-firebase");
const fb = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";
import { Observable, BehaviorSubject } from 'rxjs';
import { UtilsService } from './utils.service';
import { share } from 'rxjs/operators';
import { knownFolders, path, Folder, File } from "tns-core-modules/file-system";
import * as fs from "file-system";
import { Item } from "../item/item";
import { ImageSource, fromBase64, fromFile } from "image-source";
import { Image } from "tns-core-modules/ui/image";
import { ImageModel } from "../item/imageModel";

@Injectable()
export class FirebaseService {
  constructor(
    private zone: NgZone,
    private utils: UtilsService
  ) {
    this.getbase64images();
  }

  items: BehaviorSubject<Array<Gift>> = new BehaviorSubject([]);

  private _allItems: Array<Gift> = [];
  public restaurants: Array<Item> = [];
  public myRestaurants$: Observable<Array<Item>>;
  public images: Array<Item> = [];
  public myImages$: Observable<Array<Item>>;
  public myImageurls: Array<String> = [];
  public myBase64$: Observable<Array<ImageModel>>;
  public base64Images: Array<ImageModel> = [];
  public base64ImageString: string;
  tempFolderPath = fs.knownFolders.documents().path;

  public add(col: string, name: string): void {
    fb.firestore().collection(col)
      .add({ name: name })
      .then(() => {
        console.log('added');
      })
      .catch(err => console.log("error adding, error: " + err));
  }


  getRestaurantsObservable(): void {
    this.myRestaurants$ = Observable.create(subscriber => {
      const colRef: firestore.CollectionReference = fb.firestore().collection("restaurants");
      colRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
        this.zone.run(() => {
          this.restaurants = [];
          snapshot.forEach(docSnap =>
            this.restaurants.push({ id: docSnap.id, name: docSnap.data().name, role: docSnap.data().name }));
          subscriber.next(this.restaurants);
        });
      });
    });
  }

  public firestoreDelete(collectionName: string, docName: string): void {
    fb.firestore().collection(collectionName).doc(docName)
      .delete()
      .then(() => {
        console.log(docName, 'from', collectionName, 'deleted');
      })
      .catch(err => console.log("Delete failed, error" + err));
  }

  public firestoreUpdate(collectionName: string, docName: string, newValue: string): void {
    fb.firestore().collection(collectionName).doc(docName)
      .update({ name: newValue })
      .then(() => {
        console.log(docName, 'updated');
      })
      .catch(err => console.log('Updating', docName, 'failed, error:', JSON.stringify(err)));
  }

  public uploadbase64(path: string) {
    // Base64 formatted string
    const tempImageSource = <ImageSource>fromFile(path);
    const message = tempImageSource.toBase64String('png');
    //const message = '5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB';
    // Create a root reference
    const storageRef = fb.firestore().collection('images');
    // Create a reference to 'images/mountains.jpg'
    const ExpImagesRef = storageRef.doc('mountains.jpg');
    ExpImagesRef.set({ 'base64': message }).then(() => {
      console.log('Uploaded a base64 string!');
    })
  }
  public testbase64() {
  }
  public getbase64images() {
    this.myBase64$ = Observable.create(subscriber => {
      const colRef: firestore.CollectionReference = fb.firestore().collection('images');
      colRef.onSnapshot((snapshot: firestore.QuerySnapshot) => {
        this.zone.run(() => {
          this.base64Images = [];
          snapshot.forEach(docSnap =>
            //this.base64ImageSource = fromBase64(docSnap.data().base64)
            //this.images.push({ id: docSnap.id, name: this.tempFolderPath + '/' + docSnap.data().name, role: docSnap.data().name })
            //this.base64ImageString = docSnap.data().name
            this.base64Images.push({ id: docSnap.id, name: fromBase64(docSnap.data().name), role: docSnap.data().name })
          );
          subscriber.next(this.base64Images);
        });
      });
    });
  }

  public uploadFile(imagePath: string, filename: string, file?: any): Promise<any> {
    //let imagePath = knownFolders.temp().getFolder("100APPLE").path
    return firebase.storage.uploadFile({
      remoteFullPath: 'uploads/' + filename,
      localFullPath: imagePath,
      onProgress: function (status) {
        // console.log("Uploaded fraction: " + status.fractionCompleted);
        // console.log("Percentage complete: " + status.percentageCompleted);
      }
    }).then(() => {
      this.add('imagenames', filename);
    })
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

  login(user: string, pw: string) {
    return firebase.login({
      type: firebase.LoginType.PASSWORD,
      email: user,
      password: pw
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

  handleErrors(error) {
    console.log(JSON.stringify(error));
    return Promise.reject(error.message);
  }

  deleteLocalImages() {

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
}