import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../services/firebase.service";
import { Router } from "@angular/router";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';

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
  logout() {
    this.firebaseService.logout();
    this.routerExtensions.navigate(["/login"], { clearHistory: true });
  }
}
