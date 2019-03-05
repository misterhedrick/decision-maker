import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../services/firebase.service";
import { Router } from "@angular/router";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
const imagepicker = require("nativescript-imagepicker");

@Component({
  selector: 'ns-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css'],
  moduleId: module.id,
})
export class ImagesComponent {
  id: string;
  name: string;
  description: string;
  imagepath: string;
  image: any;
  private imagePath: string;
  private uploadedImageName: string;
  list: any;

  imageAssets = [];
  imageSrc: any;
  isSingleMode: boolean = true;
  thumbSize: number = 80;
  previewSize: number = 300;


  constructor(private firebaseService: FirebaseService, private routerExtensions: RouterExtensions) { }

  uploadImage() {
    this.id = "id";
    this.imagePath = "../src/app/assets/camera.png";
    this.uploadedImageName = "camera";
    this.description = "camera image";
    this.firebaseService.uploadFile(this.imagePath).then((uploadedFile: any) => {
      this.uploadedImageName = uploadedFile.name;
      //get downloadURL and store it as a full path;
    }, (error: any) => {
      alert('File upload error: ' + error);
    });
  }

  pickImage() {
    let context = imagepicker.create({
      mode: "single" // use "multiple" for multiple selection
    });
    this.startSelection(context);
  }

  private startSelection(context) {
    let that = this;
    context
      .authorize()
      .then(function () {
        return context.present();
      })
      .then(function (selection) {
        console.log("Selection done:");
        selection.forEach(function (selected) {
          console.log(" - " + selected.uri);
        });
      }).catch(function (e) {
        console.log(e);
      });
  }

  logout() {
    this.firebaseService.logout();
    this.routerExtensions.navigate(["/login"], { clearHistory: true });
  }
}
