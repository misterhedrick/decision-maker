import { Component, OnDestroy } from '@angular/core';
import * as fs from "tns-core-modules/file-system";
import * as imagepicker from "nativescript-imagepicker";
import { path } from "tns-core-modules/file-system";
import * as bgHttp from "nativescript-background-http";
import { isIOS } from "tns-core-modules/platform";
import { BehaviorSubject } from 'rxjs';
import { ImageSource, fromFile } from 'tns-core-modules/image-source'
import { FirebaseService } from "../services/firebase.service";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
import { alert, confirm, prompt, PromptOptions, inputType, capitalizationType, PromptResult } from "tns-core-modules/ui/dialogs";
import { Item } from "../item/item";
const PhotoViewer = require("nativescript-photoviewer");

@Component({
  selector: 'ns-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css'],
  moduleId: module.id,
})
export class ImagesComponent implements OnDestroy {
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
