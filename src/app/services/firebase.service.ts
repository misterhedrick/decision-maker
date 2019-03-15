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
    firebase.getCurrentUser()
      .then(user => this.uid = user.uid)
      .catch(error => console.log("Trouble getting uid: " + error));
  }

  items: BehaviorSubject<Array<Gift>> = new BehaviorSubject([]);
  public uid: string;
  private _allItems: Array<Gift> = [];
  public restaurants: Array<Item> = [];
  public myRestaurants$: Observable<Array<Item>>;

  public myImageurls: Array<String> = [];
  public myBase64$: Observable<Array<ImageModel>>;
  public base64Images: Array<ImageModel> = [];
  public base64ImageString: string;
  tempFolderPath = fs.knownFolders.documents().path;

  public add(col: string, name: string): void {
    fb.firestore().collection(col)
      .add({ name: name, userId: this.uid })
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
  public getbase64images() {
    this.myBase64$ = Observable.create(subscriber => {
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
      this.removeLocalImages(filename);
    })
  }

  removeLocalImages(filename: string) {
    let documents = knownFolders.documents();
    let file = documents.getFile(filename);
    file.remove()
      .then(res => {
        // Success removing the file.
        console.log("File successfully deleted!");
      }).catch(err => {
        console.log(err.stack);
      });
    console.log('removing local images');
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







}