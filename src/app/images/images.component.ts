import { Component, OnInit } from '@angular/core';
import * as fs from "file-system";
import * as imagepicker from "nativescript-imagepicker";
import { knownFolders, path } from "file-system";
import { ImageAsset } from "tns-core-modules/image-asset";
import * as bgHttp from "nativescript-background-http";
import { isIOS } from "platform";
import { of, timer, interval, BehaviorSubject, Observable } from 'rxjs';
import { sampleTime, concatMap, scan, map } from 'rxjs/operators';
import { ImageSource } from 'tns-core-modules/image-source'
import { FirebaseService } from "../services/firebase.service";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
@Component({
  selector: 'ns-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css'],
  moduleId: module.id,
})
export class ImagesComponent {
  private imagePath: string;
  imageAssets = [];
  imageSrc: any;
  isSingleMode: boolean = true;
  thumbSize: number = 80;
  previewSize: number = 300;
  constructor(private firebaseService: FirebaseService, private routerExtensions: RouterExtensions) { }

  private getImageFilePath(imageAsset): Promise<string> {
    return new Promise((resolve) => {
      if (isIOS) { // create file from image asset and return its path

        const tempFolderPath = knownFolders.temp().getFolder("nsimagepicker").path;
        const tempFilePath = path.join(tempFolderPath, `${Date.now()}.jpg`);

        // ----> ImageSource.saveToFile() implementation
        // const imageSource = new ImageSource();
        // imageSource.fromAsset(imageAsset).then(source => {
        //     const saved = source.saveToFile(tempFilePath, 'png');
        //     console.log(`saved: ${saved}`);
        //     resolve(tempFilePath);
        // });
        // <---- ImageSource.saveToFile() implementation

        // ----> Native API implementation
        // const options = PHImageRequestOptions.new();

        // options.synchronous = true;
        // options.version = PHImageRequestOptionsVersion.Current;
        // options.deliveryMode = PHImageRequestOptionsDeliveryMode.HighQualityFormat;

        // PHImageManager.defaultManager().requestImageDataForAssetOptionsResultHandler(imageAsset.ios, options, (nsData: NSData) => {
        //   nsData.writeToFileAtomically(tempFilePath, true);
        //   resolve(tempFilePath);
        // });
        // <---- Native API implementation
      } else { // return imageAsset.android, since it's the path of the file
        resolve(imageAsset.android);
      }
    });
  }


  public onSelectMultipleTap() {
    this.isSingleMode = false;

    let context = imagepicker.create({
      mode: "multiple"
    });
    this.startSelection(context);
  }

  public onSelectSingleTap() {
    this.isSingleMode = true;

    let context = imagepicker.create({
      mode: "single"
    });
    this.startSelection(context);
  }

  private startSelection(context) {
    let that = this;

    context
      .authorize()
      .then(() => {
        that.imageAssets = [];
        that.imageSrc = null;
        return context.present();
      })
      .then((selection) => {
        //console.log("Selection done: " + JSON.stringify(selection));
        that.imageSrc = that.isSingleMode && selection.length > 0 ? selection[0] : null;

        // set the images to be loaded from the assets with optimal sizes (optimize memory usage)
        selection.forEach(function (element) {
          element.options.width = that.isSingleMode ? that.previewSize : that.thumbSize;
          element.options.height = that.isSingleMode ? that.previewSize : that.thumbSize;
        });

        that.imageAssets = selection;

        // if (this.imageSrc) {
        //   this.getImageFilePath(this.imageSrc).then((path) => {
        //     console.log(`path: ${path}`);
        //     //this.uploadImage(path);
        //   });
        // }
        console.log(this.imageSrc);
      }).catch(function (e) {
        console.log(e);
      });
  }



  uploadImage() {
    this.imagePath = "../src/app/assets/camera.png";
    this.firebaseService.uploadFile(this.imagePath).then((uploadedFile: any) => {
      //get downloadURL and store it as a full path;
    }, (error: any) => {
      alert('File upload error: ' + error);
    });
  }

  logout() {
    this.firebaseService.logout();
    this.routerExtensions.navigate(["/"], { clearHistory: true });
  }
}
