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
import { alert, confirm, prompt, LoginOptions, login, LoginResult, PromptOptions, inputType, capitalizationType, PromptResult } from "ui/dialogs";
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
  public gallerypath = path.join(this.tempFolderPath, '/tempgallery');
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
    //this.base64ImageSource = <ImageSource>fromFile('/Users/e060341/Library/Developer/CoreSimulator/Devices/1239A73A-8063-4144-B85D-FBFBE4811E1F/data/Containers/Data/Application/60599D96-7E70-4D73-9DA0-6BF02C65971F/Documents/1552573926978.jpg');
    //this.firebaseService.base64ImageString = this.base64ImageSource.toBase64String('jpg');
    fs.Folder.fromPath(this.gallerypath);
    this.firebaseService.myBase64$.forEach(data =>
      data.forEach(img => {
        //img.name.saveToFile(this.gallerypath + '/123.jpg', 'jpg');
        //this.firebaseService.myImageurls.push(this.gallerypath + '/123.jpg');
      })
    );
  }

  getNewImageName(): Promise<string> {
    return new Promise((resolve) => {
      let options: PromptOptions = {
        title: "Image Name",
        okButtonText: "Add",
        cancelButtonText: "Cancel",
        cancelable: true,
        inputType: inputType.text, // email, number, text, password, or email
        capitalizationType: capitalizationType.none // all. none, sentences or words
      };

      prompt(options).then((result: PromptResult) => {
        resolve(result.text)
      });
    });

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
        let imageAsset = selection.length > 0 ? selection[0] : null;
        if (imageAsset) {
          this.getNewImageName().then((imageName) => {
            this.getImageFilePath(imageAsset, imageName).then((path) => {
              this.uploadImage(path);
              const tempImageSource = <ImageSource>fromFile(path);
              const message = tempImageSource.toBase64String('jpg', 5);
              this.firebaseService.add('images', message);
            });
          })
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
    this.firebaseService.uploadFile(path, this.currentFileNameBeingUploaded).then((uploadedFile: any) => {
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

  private getImageFilePath(imageAsset, imageName: string): Promise<string> {
    return new Promise((resolve) => {

      if (isIOS) { // create file from image asset and return its path
        const tempFilePath = path.join(this.tempFolderPath, imageName + '.jpg');
        const imageSource = new ImageSource();
        imageSource.fromAsset(imageAsset).then(source => {
          const saved = source.saveToFile(tempFilePath, 'jpg');
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
  fullScreen(index: number) {
    this.firebaseService.fullScreenImageIndex = index;
    this.routerExtensions.navigate(["/full-screen"]);
  }
  imageoptions(image: Item) {
    let options = {
      message: "Are you sure you want to delete this image?",
      okButtonText: "Yes",
      cancelButtonText: "No"
    };
    confirm(options).then((result: boolean) => {
      if (result) {
        this.firebaseService.firestoreDelete('images', image.id);
        this.firebaseService.firestoreDelete('imagenames', image.id);
      }
    });
  }

  logout() {
    this.firebaseService.logout();
    this.routerExtensions.navigate(["/"], { clearHistory: true });
  }
  ngOnDestroy() {
    // console.log('deleting images');
    // let galleryfolder = fs.knownFolders.documents().getFolder('tempgallery');
    // galleryfolder.remove()
    //   .then(fres => {
    //     // Success removing the folder.
    //   }).catch(err => {
    //     console.log(err.stack);
    //   });
  }


}
