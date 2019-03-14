import { Component, OnInit, OnDestroy } from '@angular/core';
import * as fs from "file-system";
import * as imagepicker from "nativescript-imagepicker";
import { knownFolders, path } from "file-system";
import * as bgHttp from "nativescript-background-http";
import { isIOS } from "platform";
import { of, BehaviorSubject, from } from 'rxjs';
import { sampleTime, concatMap, scan, map } from 'rxjs/operators';
import { ImageSource, fromBase64, fromFile } from 'tns-core-modules/image-source'
import { FirebaseService } from "../services/firebase.service";
import { ScrollEventData, ScrollView } from "tns-core-modules/ui/scroll-view";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
import { Image } from "tns-core-modules/ui/image";
import { EventData } from 'tns-core-modules/ui/page/page';
import { forEach } from '@angular/router/src/utils/collection';
import { stringify } from '@angular/core/src/util';
import { alert, confirm } from "ui/dialogs";
import { Item } from "../item/item";
const PhotoViewer = require("nativescript-photoviewer");

@Component({
  selector: 'ns-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css'],
  moduleId: module.id,
})
export class ImagesComponent implements OnInit, OnDestroy {
  imageFromURL1 = "https://firebasestorage.googleapis.com/v0/b/decision-maker-app.appspot.com/o/uploads%2Fbox.png?alt=media&token=65d57a78-8069-4bcf-ac4d-8be87cac63d2";
  imageFromURL2 = "https://firebasestorage.googleapis.com/v0/b/decision-maker-app.appspot.com/o/uploads%2Fbox.png?alt=media&token=65d57a78-8069-4bcf-ac4d-8be87cac63d2";
  tempFolderPath = fs.knownFolders.documents().path;
  imagesToShow: string[] = [];
  public event = new BehaviorSubject<any>({});
  private url: string;
  tempurl: string = '';
  private session: any;
  public showWelcome = true;
  public currentFileNameBeingUploaded = "";
  public base64ImageSource: ImageSource;
  public base64ImageSource2: ImageSource;
  public eventLog = this.event.pipe(
    sampleTime(200),
    concatMap(value => of(value)),
    scan((acc, logEntry) => {
      acc.push(logEntry);
      return acc;
    }, []),
    // emit only logs for the this.currentFileNameBeingUploaded
    map(allLogs => allLogs.filter(logEntry => !!logEntry && logEntry.eventTitle && logEntry.eventTitle.indexOf(this.currentFileNameBeingUploaded) > 0)));

  constructor(public firebaseService: FirebaseService, private routerExtensions: RouterExtensions) {
    // NOTE: using https://httpbin.org/post for testing purposes,
    // you'll need to use your own service in real-world app 
    if (isIOS) {
      this.url = "https://httpbin.org/post";
    } else {
      // in Android we use another service since it does not put the image into the response
      // avoiding upload error due to big response size
      this.url = "http://www.csm-testcenter.org/test";
    }
    this.session = bgHttp.session("image-upload");
  }
  ngOnInit() {
    this.firebaseService.getImageNames();
    //this.base64ImageSource = <ImageSource>fromFile('/Users/e060341/Library/Developer/CoreSimulator/Devices/1239A73A-8063-4144-B85D-FBFBE4811E1F/data/Containers/Data/Application/60599D96-7E70-4D73-9DA0-6BF02C65971F/Documents/1552573926978.jpg');
    //this.firebaseService.base64ImageString = this.base64ImageSource.toBase64String('jpg');
    this.firebaseService.getbase64images();
  }

  teststring() {
    console.log('base 64 image string', this.firebaseService.base64ImageString)
    this.base64ImageSource2 = fromBase64(this.firebaseService.base64ImageString);
  }
  public onSelectImageTap() {
    let context = imagepicker.create({
      mode: "single"
    });
    this.startSelection(context);
  }
  // private resetEventLog() {
  //     this.eventLog = this.event.pipe(
  //         sampleTime(200),
  //         concatMap(value => of(value)),
  //         scan((acc, j) => {
  //             acc.push(j);
  //             return acc;
  //         }, []));
  // }
  private startSelection(context) {
    context
      .authorize()
      .then(() => {
        return context.present();
      })
      .then((selection) => {
        this.showWelcome = false;
        // this.resetEventLog();
        console.log("Selection done: " + JSON.stringify(selection));
        let imageAsset = selection.length > 0 ? selection[0] : null;
        if (imageAsset) {
          this.getImageFilePath(imageAsset).then((path) => {
            console.log(`path: ${path}`);
            //this.uploadImage(path);
            const tempImageSource = <ImageSource>fromFile(path);
            const message = tempImageSource.toBase64String('jpg', 5);
            //this.firebaseService.uploadbase64(path);
            this.firebaseService.add('images', message);
          });
        }
      }).catch(function (e) {
        console.log(e);
      });
  }

  private uploadImage(path: string) {
    let file = fs.File.fromPath(path);
    this.currentFileNameBeingUploaded = file.path.substr(file.path.lastIndexOf("/") + 1);

    const request = this.createNewRequest();
    request.description = `uploading image ${file.path}`;
    request.headers["File-Name"] = this.currentFileNameBeingUploaded;

    // -----> multipart upload
    // const params = [
    //     {
    //         name: "test",
    //         value: "value"
    //     },
    //     {
    //         name: "fileToUpload",
    //         filename: file.path,
    //         mimeType: 'image/jpeg'
    //     }
    // ];

    // let task = this.session.multipartUpload(params, request);
    // <----- multipart upload

    let task = this.session.uploadFile(file.path, request);
    console.log('path', path);
    console.log('filename', this.currentFileNameBeingUploaded);
    this.firebaseService.uploadFile(path, this.currentFileNameBeingUploaded).then((uploadedFile: any) => {
      //get downloadURL and store it as a full path;
    }, (error: any) => {
      alert('File upload error: ' + error);
    });

    task.on("progress", this.onEvent.bind(this));
    task.on("error", this.onEvent.bind(this));
    task.on("responded", this.onEvent.bind(this));
    task.on("complete", this.onEvent.bind(this));
  }

  private createNewRequest() {
    const request = {
      url: this.url,
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream"
      },
      description: "uploading file...",
      androidAutoDeleteAfterUpload: false,
      androidNotificationTitle: "NativeScript HTTP background"
    };
    return request;
  }

  private getImageFilePath(imageAsset): Promise<string> {
    return new Promise((resolve) => {
      if (isIOS) { // create file from image asset and return its path
        const tempFilePath = path.join(this.tempFolderPath, `${Date.now()}.jpg`);
        const imageSource = new ImageSource();
        imageSource.fromAsset(imageAsset).then(source => {
          const saved = source.saveToFile(tempFilePath, 'png');
          resolve(tempFilePath);
        });
      } else { // return imageAsset.android, since it's the path of the file
        resolve(imageAsset.android);
      }
    });
  }

  private onEvent(e) {
    this.event.next({
      eventTitle: e.eventName + " " + e.object.description,
      eventData: {
        error: e.error ? e.error.toString() : e.error,
        currentBytes: e.currentBytes,
        totalBytes: e.totalBytes,
        body: e.data,
        // raw: JSON.stringify(e) // uncomment for debugging purposes
      }
    });
  }

  openGallery(index) {
    let photoViewer = new PhotoViewer();
    photoViewer.startIndex = index; // start index for the fullscreen gallery
    // Add to array and pass to showViewer
    var myImages = [];
    this.firebaseService.images.forEach(function (image) {
      myImages.push(image.name);
    });

    photoViewer.showViewer(this.firebaseService.myImageurls);
  }
  imageoptions(image: Item) {
    confirm({
      message: "Are you sure you want to delete this image?",
      okButtonText: "Yes",
      cancelButtonText: "Cancel"
    }).then(result => {
      // result argument is boolean
      this.firebaseService.deleteImagesFromFirebase(image.role);
      this.firebaseService.firestoreDelete('imagenames', image.id);
    });
  }

  galleryShowing() {
    console.log(`gallery Loaded`);
  }
  logout() {
    this.firebaseService.logout();
    this.routerExtensions.navigate(["/"], { clearHistory: true });
  }
  ngOnDestroy() {
    console.log('deleting images');
    //this.firebaseService.deleteLocalImages(); 
  }


}
