import { Injectable, NgZone } from "@angular/core";
import { User, Gift } from "../models";
import { BackendService } from "./backend.service";
import { firebase } from 'nativescript-plugin-firebase/firebase-common';
const fb = require("nativescript-plugin-firebase/app");
import { firestore } from "nativescript-plugin-firebase";
import { Observable, BehaviorSubject } from 'rxjs';
import { UtilsService } from './utils.service';
import { knownFolders } from "tns-core-modules/file-system";
import * as fs from "tns-core-modules/file-system";
import { Item } from "../item/item";
import { fromBase64 } from "tns-core-modules/image-source";
import { ImageModel } from "../item/imageModel";

@Injectable()
export class FirebaseService {
  constructor(
    private zone: NgZone,
    private utils: UtilsService,
    public bs: BackendService
  ) {
    // firebase.getCurrentUser()
    //   .then(user => {
    //     this.uid = user.uid,
    //       this.email = user.email
    //   }
    //   ).then(() => {
    //     this.getbase64images();
    //   })
    //   .catch(error => console.log("Trouble getting uid: " + error),
    //     this.uid = this.bs.getMainUser());
  }

  items: BehaviorSubject<Array<Gift>> = new BehaviorSubject([]);
  public uid: string;
  public email: string;
  private _allItems: Array<Gift> = [];
  public restaurants: Array<Item> = [];
  public myRestaurants$: Observable<Array<Item>>;
  public myImageurls: Array<String> = [];
  public myBase64$: Observable<Array<ImageModel>>;
  public base64Images: Array<ImageModel> = [];
  public fullScreenImageIndex: number = 0;
  public base64ImageString: string;
  tempFolderPath = fs.knownFolders.documents().path;

  setEmail(email: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.email = email;
      resolve(true);
    });
  }
  public addRestaurant(col: string, name: string): void {
    fb.firestore().collection(col)
      .add({ name: name, userId: this.email })
      .then(() => {
      })
      .catch(err => console.log("error adding, error: " + err));
  }

  public addImage(col: string, name: string): void {
    fb.firestore().collection(col)
      .add({ name: name, userId: this.uid })
      .then(() => {
      })
      .catch(err => console.log("error adding, error: " + err));
  }


  getRestaurantsObservable(): void {
    this.myRestaurants$ = Observable.create(subscriber => {
      const colRef: firestore.CollectionReference = fb.firestore().collection("restaurants").where("userId", "==", this.email);
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
      })
      .catch(err => console.log("Delete failed, error" + err));
  }

  public firestoreUpdate(collectionName: string, docName: string, newValue: string): void {
    fb.firestore().collection(collectionName).doc(docName)
      .update({ name: newValue })
      .then(() => {
      })
      .catch(err => console.log('Updating', docName, 'failed, error:', JSON.stringify(err)));
  }
  public getbase64images() {
    this.myBase64$ = Observable.create(subscriber => {
      console.log(this.uid);
      const colRef: firestore.CollectionReference = fb.firestore().collection('images').where("userId", "==", this.uid);
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
    })
  }

  public uploadFile(imagePath: string, filename: string, file?: any): Promise<any> {
    //let imagePath = knownFolders.temp().getFolder("100APPLE").path
    return firebase.storage.uploadFile({
      remoteFullPath: 'uploads/' + this.email + '/' + filename,
      localFullPath: imagePath,
      onProgress: function (status) {
        // console.log("Uploaded fraction: " + status.fractionCompleted);
        // console.log("Percentage complete: " + status.percentageCompleted);
      }
    }).then(() => {
      this.addImage('imagenames', filename);
      this.removeLocalImages(filename);
    })
  }

  removeLocalImages(filename: string) {
    let documents = knownFolders.documents();
    let file = documents.getFile(filename);
    file.remove()
      .then(res => {
        // Success removing the file.
      }).catch(err => {
        console.log(err.stack);
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
      this.bs.token = result.uid;
      return JSON.stringify(result);
    }, (errorMessage: any) => {
      alert(errorMessage);
    });
  }

  logout() {
    this.bs.token = "";
    firebase.logout();
  }







}