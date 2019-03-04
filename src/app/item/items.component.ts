import { Component, OnInit } from "@angular/core";

import { Item } from "./item";
import { ItemService } from "./item.service";
import { FirebaseService } from "../services/firebase.service";
import { Router } from "@angular/router";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';

@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html",
})
export class ItemsComponent implements OnInit {
    items: Item[];
    id: string;
    name: string;
    description: string;
    imagepath: string;
    image: any;
    private imagePath: string;
    private uploadedImageName: string;

    // This pattern makes use of Angular’s dependency injection implementation to inject an instance of the ItemService service into this class.
    // Angular knows about this service because it is included in your app’s main NgModule, defined in app.module.ts.
    constructor(private itemService: ItemService, private routerExtensions: RouterExtensions, private firebaseService: FirebaseService,
        private router: Router) { }

    ngOnInit(): void {
        this.items = this.itemService.getItems();
    }
    logout() {
        this.firebaseService.logout();
        this.routerExtensions.navigate(["/login"], { clearHistory: true });
    }
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
}