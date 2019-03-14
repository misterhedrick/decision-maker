import { Component, OnInit } from "@angular/core";

import { Item } from "./item";
import { ItemService } from "./item.service";
import { FirebaseService } from "../services/firebase.service";
import { Router } from "@angular/router";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
import { alert, login, LoginResult, LoginOptions } from "ui/dialogs";
import { prompt } from "ui/dialogs";
import { SwipeGestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { User } from "../models";

@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html",
})
export class ItemsComponent implements OnInit {
    items: Item[];
    isLoggingIn = true;
    isAuthenticating = false;
    // This pattern makes use of Angular’s dependency injection implementation to inject an instance of the ItemService service into this class.
    // Angular knows about this service because it is included in your app’s main NgModule, defined in app.module.ts.
    constructor(private itemService: ItemService, private routerExtensions: RouterExtensions, public firebaseService: FirebaseService,
        private router: Router) { }

    ngOnInit(): void {
        this.firebaseService.getRestaurantsObservable();
        //this.items = this.itemService.getItems();
    }
    logout() {
        this.firebaseService.logout();
        this.routerExtensions.navigate(["/"], { clearHistory: true });
    }
    login() {

        login({
            title: "Login",
            message: "Enter your user and pw",
            okButtonText: "Login",
            cancelButtonText: "Cancel",
            userName: "user@nativescript.org",
            password: "password"
        }).then((data) => {
            if (data.result) {
                this.firebaseService.login(data.userName, data.password)
                    .then(() => {
                        console.log('user and pass', data.userName + '  ' + data.password);
                        this.isAuthenticating = false;
                        this.routerExtensions.navigate(["/images"], { clearHistory: true });
                    })
                    .catch((message: any) => {
                        this.isAuthenticating = false;
                    });
            }
        });
    }
    navigate() {
        this.routerExtensions.navigate(["/images"], { clearHistory: true });
    }
    choose() {
        let itemNumber = Math.floor(Math.random() * (this.firebaseService.restaurants.length));
        alert({
            title: this.firebaseService.restaurants[itemNumber].name,
            okButtonText: "Ok",
        });
    }

    onSwipe(args: SwipeGestureEventData, id: string) {
        if (args.direction === 2) {
            this.firebaseService.firestoreDelete('restaurants', id);
        }
    }

    editItem(item: Item) {
        prompt({
            title: "New Item Name",
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        }).then((data) => {
            if (data.result) {
                this.firebaseService.firestoreUpdate('restaurants', item.id, data.text.trim())
            }
        });
    }

    addItem() {
        //this.firebaseService.add('picklists', 'restaurants', 'hops');
        prompt({
            title: "Item Name",
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        }).then((data) => {
            if (data.result) {
                this.firebaseService.add('restaurants', data.text.trim())
            }
        });
    }
}