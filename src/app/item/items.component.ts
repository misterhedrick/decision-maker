import { Component, OnInit } from "@angular/core";

import { Item } from "./item";
import { ItemService } from "./item.service";
import { FirebaseService } from "../services/firebase.service";
import { Router } from "@angular/router";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
import { alert } from "ui/dialogs";
@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html",
})
export class ItemsComponent implements OnInit {
    items: Item[];
    // This pattern makes use of Angular’s dependency injection implementation to inject an instance of the ItemService service into this class.
    // Angular knows about this service because it is included in your app’s main NgModule, defined in app.module.ts.
    constructor(private itemService: ItemService, private routerExtensions: RouterExtensions, private firebaseService: FirebaseService,
        private router: Router) { }

    ngOnInit(): void {
        this.items = this.itemService.getItems();
    }
    logout() {
        this.firebaseService.logout();
        this.routerExtensions.navigate(["/"], { clearHistory: true });
    }

    navigate() {
        this.routerExtensions.navigate(["/images"], { clearHistory: true });
    }
    choose() {
        let itemNumber = Math.floor(Math.random() * (this.itemService.getItems().length) + 1);
        alert({
            title: "Go Eat At " + this.itemService.getItem(itemNumber).name,
            okButtonText: "Ok",
        });
    }
}